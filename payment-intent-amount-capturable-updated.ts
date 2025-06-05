import prisma from "@/lib/prismadb";
import { basketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import webPush, { PushSubscription } from "web-push";

export async function handlePaymentIntentAmountCapturable(
  paymentIntent: Stripe.PaymentIntent,
): Promise<NextResponse | void> {
  const buyerId = paymentIntent.metadata?.userId;
  const orderGroupId = paymentIntent.metadata?.orderGroupId;

  if (!buyerId) {
    console.error("Missing buyerId in payment intent metadata:", paymentIntent.id);
    return;
  }

  console.log(`Processing payment intent ${paymentIntent.id} for buyer ${buyerId}`);

  const createdOrder = await handleBasketProcessing(buyerId, paymentIntent);
  
  if (!createdOrder) {
    console.error("Failed to create order for payment intent:", paymentIntent.id);
    return;
  }

  await createConversationAndNotify(createdOrder);

  if (orderGroupId) {
    await addOrderToGroup(createdOrder.id, orderGroupId);
  }

  console.log(`Successfully processed payment intent ${paymentIntent.id}, created order ${createdOrder.id}`);
}

async function handleBasketProcessing(
  buyerId: string,
  paymentIntent: Stripe.PaymentIntent,
) {
  const basketId = paymentIntent.metadata.basketId;

  if (!basketId) {
    throw new Error("No basketId found in payment intent metadata");
  }

  const basket = await findActiveBasket(basketId, buyerId);
  
  if (!basket) {
    throw new Error(`Basket ${basketId} not found`);
  }

  return await createOrderFromBasket(basket, buyerId, paymentIntent);
}

async function findActiveBasket(basketId: string, buyerId: string) {
  return prisma.basket.findFirst({
    where: {
      id: basketId,
      userId: buyerId,
      status: basketStatus.ACTIVE,
    },
    select: {
      id: true,
      proposedLoc: true,
      pickupDate: true,
      deliveryDate: true,
      orderMethod: true,
      items: {
        select: {
          quantity: true,
          price: true,
          listing: {
            select: {
              id: true,
              title: true,
              unit: true,
              stock: true,
              price: true,
              subcategory: true,
              minOrder: true,
            },
          },
        },
      },
      location: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              url: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });
}

async function createOrderFromBasket(
  basket: any,
  buyerId: string,
  paymentIntent: Stripe.PaymentIntent,
) {
  return prisma.$transaction(async (tx) => {
    const totalPrice = basket.items.reduce(
      (acc: number, item: any) => acc + item.quantity * item.price,
      0,
    );

    const newOrder = await tx.order.create({
      data: {
        userId: buyerId,
        locationId: basket.location.id,
        proposedLoc: basket.proposedLoc,
        paymentIntentId: paymentIntent.id,
        sellerId: basket.location.user.id,
        pickupDate: basket.pickupDate ? new Date(basket.pickupDate) : null,
        items: basket.items,
        totalPrice,
        status: "BUYER_PROPOSED_TIME",
        fulfillmentType: basket.orderMethod,
        fee: { site: totalPrice * 0.06 },
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    await updateInventoryLevels(tx, basket.items);

    await tx.basket.delete({
      where: { id: basket.id },
    });

    return newOrder;
  });
}

async function updateInventoryLevels(tx: any, items: any[]) {
  await Promise.all(
    items.map((item) =>
      tx.listing.update({
        where: { id: item.listing.id },
        data: { stock: item.listing.stock - item.quantity },
      }),
    ),
  );
}

async function addOrderToGroup(orderId: string, orderGroupId: string) {
  const cleanOrderGroupId = orderGroupId.replace(/['"]+/g, "");

  await prisma.orderGroup.update({
    where: { id: cleanOrderGroupId },
    data: {
      orderids: {
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

async function updateOrderWithConversation(orderId: string, conversationId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { conversationId },
  });
}

async function formatOrderItems(items: any[]): Promise<string> {
  const itemDescriptions = items.map((item: any) => {
    const listing = item.listing;
    return listing ? `${item.quantity} ${listing.unit} of ${listing.title}` : "";
  });
  
  return itemDescriptions.filter(Boolean).join(", ");
}

async function handlePickupOrder(order: any, conversation: any, orderSummary: string) {
  const pickupTime = order.pickupDate?.toLocaleTimeString() || "a convenient time";
  const pickupDate = order.pickupDate?.toLocaleDateString() || "a convenient date";
  
  const message = `Hi ${order.seller.name}! I just ordered ${orderSummary} from you and would like to pick them up at ${pickupTime} on ${pickupDate}. Please let me know when my order is ready or if that time doesn't work.`;

  await createOrderMessage(conversation.id, order.buyer.id, message);
  await sendPushNotification(order.seller, "You have a new order!", message, conversation.id);
}

async function handleDeliveryOrder(order: any, conversation: any, orderSummary: string) {
  await updateOrderDeliveryLocation(order);
  
  const deliveryAddress = getDeliveryAddress(order.buyer);
  const message = `Hi ${order.seller.name}! I just ordered ${orderSummary} from you, please drop them off at ${deliveryAddress} during my open hours. My hours can be viewed in More Options.`;

  await createOrderMessage(conversation.id, order.buyer.id, message);
  await sendPushNotification(order.seller, "You have a new order!", message, conversation.id);
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
  const location = buyer.location?.[0] || buyer.location?.[1] || buyer.location?.[2];
  
  if (!location?.address) {
    return "this user has no locations set";
  }

  const { street, city, state, zip } = location.address;
  return `${street}, ${city}, ${state}. ${zip}`;
}

async function createOrderMessage(conversationId: string, senderId: string, body: string) {
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
