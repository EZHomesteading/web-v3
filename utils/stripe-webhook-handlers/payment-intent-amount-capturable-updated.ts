import prisma from "@/lib/prismadb";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import webPush, { PushSubscription } from "web-push";

//
// const meta: Record<string, any> = {
//   order_meta: {
//     store_id: order.orderPayload.storeId,
//     store_name: order.orderPayload.storeName,
//     order_id: "TEMP_ORDER_ID",
//     item_count: order.items.length,
//     total_amt: order.orderPayload.totalAmount,
//   },
//   user_meta: {
//     st_id: customerId,
//     id: order.customerPayload.id,
//     name: order.customerPayload.name,
//   },
//   basket_meta: {
//     id: order.basketPayload.id,
//     proposed_loc: order.basketPayload.proposedLoc,
//     fulfillment_date: order.basketPayload.fulfillmentDate,
//     order_method: order.basketPayload.orderMethod,
//     status: order.basketPayload.status,
//     time_type: order.basketPayload.timeType,
//     order_group_id: order.basketPayload.orderGroupId,
//   },
// };
//

export async function handlePaymentIntentAmountCapturable(
  paymentIntent: Stripe.PaymentIntent,
): Promise<NextResponse | void> {
  const orderData = extractOrderDataFromMetadata(paymentIntent.metadata);

  if (!orderData) {
    return;
  }

  const createdOrder = await createOrderFromMetadata(orderData, paymentIntent);

  if (!createdOrder) {
    return;
  }

  await createConversationAndNotify(createdOrder);

  if (orderData.basket.order_group_id) {
    await addOrderToGroup(createdOrder.id, orderData.basket.order_group_id);
  }
}

function extractOrderDataFromMetadata(metadata: Record<string, string>) {
  try {
    const orderMeta = JSON.parse(metadata.order_meta);
    const userMeta = JSON.parse(metadata.user_meta);
    const basketMeta = JSON.parse(metadata.basket_meta);

    if (!orderMeta || !userMeta || !basketMeta) {
      throw new Error("Missing required metadata sections");
    }

    const items: any[] = [];
    Object.keys(metadata).forEach((key) => {
      if (key.startsWith("id_")) {
        const itemData = JSON.parse(metadata[key]);
        items.push({
          id: key.replace("id_", ""),
          title: itemData.t,
          unit: itemData.u,
          price: itemData.p,
          quantity: itemData.q,
          image: itemData.i,
        });
      }
    });

    return {
      order: orderMeta,
      user: userMeta,
      basket: basketMeta,
      items,
      notes: metadata.notes || "",
    };
  } catch (error) {
    console.error("Error parsing metadata:", error);
    return null;
  }
}

async function createOrderFromMetadata(
  orderData: any,
  paymentIntent: Stripe.PaymentIntent,
) {
  return prisma.$transaction(async (tx) => {
    const seller = await tx.user.findUnique({
      where: { id: orderData.order.store_id },
      select: { id: true, name: true, role: true },
    });

    const buyer = await tx.user.findUnique({
      where: { id: orderData.user.id },
      select: { id: true, name: true, role: true },
    });

    if (!seller || !buyer) {
      throw new Error("Seller or buyer not found");
    }

    const totalPrice = orderData.order.total_amt;

    const newOrder = await tx.order.create({
      data: {
        userId: orderData.user.id,
        locationId: orderData.order.store_id,
        proposedLoc: orderData.basket.proposed_loc,
        paymentIntentId: paymentIntent.id,
        sellerId: seller.id,
        fulfillmentDate: orderData.basket.fulfillment_date,
        items: orderData.items.map((item: any) => ({
          listingId: item.id,
          quantity: item.quantity,
          price: item.price,
          title: item.title,
          unit: item.unit,
        })),
        totalPrice,
        status: "BUYER_PROPOSED_TIME",
        fulfillmentType: orderData.basket.fulfillment_type,
        fee: { site: totalPrice * 0.06 },
        notes: orderData.notes,
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    await updateInventoryLevels(tx, orderData.items);

    await tx.basket.delete({
      where: { id: orderData.basket.id },
    });

    return newOrder;
  });
}

async function updateInventoryLevels(tx: any, items: any[]) {
  await Promise.all(
    items.map((item: any) =>
      tx.listing.update({
        where: { id: item.id },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      }),
    ),
  );
}

async function addOrderToGroup(orderId: string, orderGroupId: string) {
  const cleanOrderGroupId = orderGroupId.replace(/['"]+/g, "");

  await prisma.orderGroup.update({
    where: { id: cleanOrderGroupId },
    data: {
      orderIds: {
        push: orderId.toString(),
      },
    },
  });

  console.log(`Added order ${orderId} to order group ${cleanOrderGroupId}`);
}

async function createConversationAndNotify(order: any) {
  const conversation = await createOrderConversation(order);
  await updateOrderWithConversation(order.id, conversation.id);

  const orderSummary = await formatOrderItems(order.items);

  if (order.fulfillmentType === "PICKUP") {
    await handlePickupOrder(order, conversation, orderSummary);
  } else if (order.fulfillmentType === "DELIVERY") {
    await handleDeliveryOrder(order, conversation, orderSummary);
  }

  return conversation;
}

async function createOrderConversation(order: any) {
  return prisma.conversation.create({
    data: {
      participantIds: [order.buyer.id, order.seller.id],
    },
  });
}

async function updateOrderWithConversation(
  orderId: string,
  conversationId: string,
) {
  await prisma.order.update({
    where: { id: orderId },
    data: { conversationId },
  });
}

async function formatOrderItems(items: any[]): Promise<string> {
  const itemDescriptions = items.map((item: any) => {
    return `${item.quantity} ${item.unit} of ${item.title}`;
  });

  return itemDescriptions.filter(Boolean).join(", ");
}

async function handlePickupOrder(
  order: any,
  conversation: any,
  orderSummary: string,
) {
  const pickupTime =
    order.pickupDate?.toLocaleTimeString() || "a convenient time";
  const pickupDate =
    order.pickupDate?.toLocaleDateString() || "a convenient date";

  const message = `Hi ${order.seller.name}! I just ordered ${orderSummary} from you and would like to pick them up at ${pickupTime} on ${pickupDate}. Please let me know when my order is ready or if that time doesn't work.`;

  await createOrderMessage(conversation.id, order.buyer.id, message);
  await sendPushNotification(
    order.seller,
    "You have a new order!",
    message,
    conversation.id,
  );
}

async function handleDeliveryOrder(
  order: any,
  conversation: any,
  orderSummary: string,
) {
  await updateOrderDeliveryLocation(order);

  const deliveryAddress = getDeliveryAddress(order.buyer);
  const message = `Hi ${order.seller.name}! I just ordered ${orderSummary} from you, please drop them off at ${deliveryAddress} during my open hours. My hours can be viewed in More Options.`;

  await createOrderMessage(conversation.id, order.buyer.id, message);
  await sendPushNotification(
    order.seller,
    "You have a new order!",
    message,
    conversation.id,
  );
}

async function updateOrderDeliveryLocation(order: any) {
  const defaultLocation =
    order.buyer.location?.[0] ||
    order.buyer.location?.[1] ||
    order.buyer.location?.[2] ||
    order.location;

  await prisma.order.update({
    where: { id: order.id },
    data: { location: defaultLocation },
  });
}

function getDeliveryAddress(buyer: any): string {
  const location =
    buyer.location?.[0] || buyer.location?.[1] || buyer.location?.[2];

  if (!location?.address) {
    return "this user has no locations set";
  }

  const { street, city, state, zip } = location.address;
  return `${street}, ${city}, ${state}. ${zip}`;
}

async function createOrderMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  await prisma.message.create({
    data: {
      body,
      messageOrder: "BUYER_PROPOSED_TIME",
      conversation: { connect: { id: conversationId } },
      sender: { connect: { id: senderId } },
    },
    include: { sender: true },
  });
}

async function sendPushNotification(
  seller: any,
  title: string,
  body: string,
  conversationId: string,
) {
  try {
    if (!seller.subscriptions) return;

    const subscriptions = JSON.parse(seller.subscriptions);
    const vapidDetails = {
      subject: "mailto:ezhomesteading@gmail.com",
      publicKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY as string,
      privateKey: process.env.WEB_PUSH_PRIVATE_KEY as string,
    };

    await Promise.all(
      subscriptions.map((subscription: PushSubscription) =>
        webPush.sendNotification(
          subscription,
          JSON.stringify({ title, body, id: conversationId }),
          { vapidDetails },
        ),
      ),
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}
