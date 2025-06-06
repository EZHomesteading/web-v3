import prisma from "@/lib/prismadb";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import webPush, { PushSubscription } from "web-push";

export async function handlePaymentIntentAmountCapturable(
  paymentIntent: Stripe.PaymentIntent,
): Promise<NextResponse | void> {
  console.log("🎯 Step 1: Extracting order data from metadata");

  try {
    const orderData = extractOrderDataFromMetadata(paymentIntent.metadata);
    console.log("📦 Order data extracted:", !!orderData);

    if (!orderData) {
      console.log("❌ No order data found, exiting");
      return;
    }

    console.log("🔍 Order data structure:", {
      hasOrder: !!orderData.order,
      hasUser: !!orderData.user,
      hasBasket: !!orderData.basket,
      itemCount: orderData.items?.length || 0,
      hasNotes: !!orderData.notes,
    });

    console.log("🎯 Step 2: Creating order from metadata");
    const createdOrder = await createOrderFromMetadata(
      orderData,
      paymentIntent,
    );

    if (!createdOrder) {
      return;
    }

    await createConversationAndNotify(createdOrder);

    if (orderData.basket.order_group_id) {
      console.log(
        "🎯 Step 4: Adding order to group:",
        orderData.basket.order_group_id,
      );
      await addOrderToGroup(createdOrder.id, orderData.basket.order_group_id);
      console.log("✅ Order added to group");
    } else {
      console.log("⏭️ No order group ID, skipping group assignment");
    }

    console.log("🎉 Payment intent handler completed successfully");
  } catch (error) {
    console.error("❌ Error in handlePaymentIntentAmountCapturable:", error);
    console.error("📍 Stack trace:", error);
    throw error;
  }
}

function extractOrderDataFromMetadata(metadata: Record<string, string>) {
  console.log("🔍 Extracting metadata with keys:", Object.keys(metadata));

  try {
    console.log("📊 Parsing order_meta...");
    const orderMeta = JSON.parse(metadata.order_meta);
    console.log("✅ Order meta parsed:", orderMeta);

    console.log("📊 Parsing user_meta...");
    const userMeta = JSON.parse(metadata.user_meta);
    console.log("✅ User meta parsed:", userMeta);

    console.log("📊 Parsing basket_meta...");
    const basketMeta = JSON.parse(metadata.basket_meta);
    console.log("✅ Basket meta parsed:", basketMeta);

    if (!orderMeta || !userMeta || !basketMeta) {
      console.error("❌ Missing required metadata sections:", {
        orderMeta: !!orderMeta,
        userMeta: !!userMeta,
        basketMeta: !!basketMeta,
      });
      throw new Error("Missing required metadata sections");
    }

    console.log("📦 Processing item metadata...");
    const items: any[] = [];
    Object.keys(metadata).forEach((key) => {
      if (key.startsWith("id_")) {
        try {
          const itemData = JSON.parse(metadata[key]);
          console.log(`✅ Parsed item ${key}:`, itemData);
          items.push({
            id: key.replace("id_", ""),
            title: itemData.t,
            unit: itemData.u,
            price: itemData.p,
            quantity: itemData.q,
            image: itemData.i,
          });
          console.log("ITEMS", items);
        } catch (itemError) {
          console.error(`❌ Error parsing item ${key}:`, itemError);
          console.error(`❌ Item data: ${metadata[key]}`);
          throw itemError;
        }
      }
    });

    console.log(`✅ Processed ${items.length} items successfully`);

    const result = {
      order: orderMeta,
      user: userMeta,
      basket: basketMeta,
      items,
      notes: metadata.notes || "",
    };

    console.log("✅ Metadata extraction completed successfully");
    return result;
  } catch (error) {
    console.error("❌ Error parsing metadata:", error);
    console.error("📋 Raw metadata:", metadata);
    return null;
  }
}

async function createOrderFromMetadata(
  orderData: any,
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log("🏗️ Starting database transaction");

  try {
    return await prisma.$transaction(async (tx) => {
      console.log("🔍 Looking up store with ID:", orderData.order.store_id);
      const store = await tx.location.findUnique({
        where: { id: orderData.order.store_id },
        select: {
          id: true,
          name: true,
          role: true,
          user: { select: { id: true } },
        },
      });
      console.log("👨‍💼 Seller found:", !!store, store?.name);

      console.log("🔍 Looking up buyer with ID:", orderData.user.id);
      const buyer = await tx.user.findUnique({
        where: { id: orderData.user.id },
        select: {
          id: true,
          name: true,
          role: true,
        },
      });
      console.log("👤 Buyer found:", !!buyer, buyer?.name);

      if (!store || !buyer) {
        const error = new Error(
          `Seller or buyer not found - Seller: ${!!store}, Buyer: ${!!buyer}`,
        );
        console.error("❌", error.message);
        throw error;
      }

      const totalPrice = orderData.order.total_amt;
      console.log("💰 Total price:", totalPrice);

      console.log("📝 Creating order record...");
      const newOrder = await tx.order.create({
        data: {
          userId: orderData.user.id,
          locationId: orderData.order.store_id,
          proposedLoc: orderData.basket.proposed_loc,
          paymentIntentId: paymentIntent.id,
          sellerId: store.user.id,
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
          fulfillmentType: orderData.basket.order_method || "PICKUP",
          fee: { site: totalPrice * 0.06 },
          notes: orderData.notes,
        },
      });
      console.log("✅ Order created with ID:", newOrder.id);

      console.log("📦 Updating inventory levels...");
      await updateInventoryLevels(tx, orderData.items);
      console.log("✅ Inventory updated");

      console.log("🗑️ Deleting basket:", orderData.basket.id);
      await tx.basket.delete({
        where: { id: orderData.basket.id },
      });
      console.log("✅ Basket deleted");

      console.log("✅ Transaction completed successfully");
      return newOrder;
    });
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    console.error("📍 Transaction error stack:", error);
    throw error;
  }
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
      participantIds: [order.userId, order.sellerId],
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

  const message = `Hi! I just ordered ${orderSummary} from you and would like to pick them up at ${pickupTime} on ${pickupDate}. Please let me know when my order can be ready by that time or if that doesn't work.`;

  await createOrderMessage(conversation.id, order.userId, message);
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
  const message = `Hi! I just ordered ${orderSummary} from you, please drop them off at ${deliveryAddress} during my open hours. My hours can be viewed in More Options.`;

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
    if (!seller?.subscriptions) return;

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
