import prisma from "@/lib/prismadb";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { basketStatus } from "@prisma/client";
import webPush, { PushSubscription } from "web-push";

// Configure as edge function for better raw body handling
export const config = {
  runtime: "edge",
};

// Use the API version that matches your webhook events
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // Match the version in your webhook events
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Original business logic function - preserved as is
async function handleBasketProcessing(
  buyerId: string,
  paymentIntent: Stripe.PaymentIntent
) {
  // Get the basketId from the payment intent metadata
  const basketId = paymentIntent.metadata.basketId;

  const basket = await prisma.basket.findFirst({
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

  if (!basket) {
    throw new Error(`Basket ${basketId} not found`);
  }

  // Use a transaction to ensure data consistency
  const order = await prisma.$transaction(async (tx) => {
    const totalPrice = basket.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    // Create order
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

    // Update stock levels
    await Promise.all(
      basket.items.map((item) =>
        tx.listing.update({
          where: { id: item.listing.id },
          data: { stock: item.listing.stock - item.quantity },
        })
      )
    );

    // Delete the basket
    await tx.basket.delete({
      where: { id: basket.id },
    });

    return newOrder;
  });

  return order;
}

// Original conversation and notification function - preserved as is
async function createConversationAndNotify(order: any) {
  // Create new conversation for each order
  const conversation = await prisma.conversation.create({
    data: {
      participantIds: [order.buyer.id, order.seller.id],
    },
  });

  // Update order with new conversation ID
  await prisma.order.update({
    where: { id: order.id },
    data: { conversationId: conversation.id },
  });

  // Format ordered items
  const items = order.items;
  const itemDescriptions = await Promise.all(
    items.map(async (item: any) => {
      const listing = item.listing;
      return listing
        ? `${item.quantity} ${listing.unit} of ${listing.title}`
        : "";
    })
  );
  const titles = itemDescriptions.filter(Boolean).join(", ");

  // Prepare message bodies
  const coopBody = `Hi ${
    order.seller.name
  }! I just ordered ${titles} from you and would like to pick them up at ${order.pickupDate.toLocaleTimeString()} on ${order.pickupDate.toLocaleDateString()}. Please let me know when my order is ready or if that time doesn't work.`;

  const producerBody = `Hi ${
    order.seller.name
  }! I just ordered ${titles} from you, please drop them off at ${
    order.buyer.location && order.buyer.location[0]
      ? `${order.buyer.location[0]?.address.street}, ${order.buyer.location[0]?.address.city}, ${order.buyer.location[0]?.address.state}. ${order.buyer.location[0]?.address.zip}`
      : order.buyer.location && order.buyer.location[1]
      ? `${order.buyer.location[0]?.address.street}, ${order.buyer.location[0]?.address.city}, ${order.buyer.location[0]?.address.state}. ${order.buyer.location[0]?.address.zip}`
      : order.buyer.location && order.buyer.location[2]
      ? `${order.buyer.location[0]?.address.street}, ${order.buyer.location[0]?.address.city}, ${order.buyer.location[0]?.address.state}. ${order.buyer.location[0]?.address.zip}`
      : "this user has no locations set"
  } during my open hours. My hours can be viewed in More Options.`;

  // Create message and send notifications based on fulfillment type
  if (order.fulfillmentType === "PICKUP") {
    await prisma.message.create({
      data: {
        body: coopBody,
        messageOrder: "BUYER_PROPOSED_TIME",
        conversation: {
          connect: { id: conversation.id },
        },
        sender: {
          connect: { id: order.buyer.id },
        },
      },
      include: {
        sender: true,
      },
    });

    // Send push notification
    try {
      if (order.seller.subscriptions) {
        const formatrecipients = JSON.parse(order.seller.subscriptions);
        await Promise.all(
          formatrecipients.map((subscription: PushSubscription) =>
            webPush.sendNotification(
              subscription,
              JSON.stringify({
                title: "You have a new order!",
                body: coopBody,
                id: conversation.id,
              }),
              {
                vapidDetails: {
                  subject: "mailto:ezhomesteading@gmail.com",
                  publicKey: process.env
                    .NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY as string,
                  privateKey: process.env.WEB_PUSH_PRIVATE_KEY as string,
                },
              }
            )
          )
        );
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  if (order.fulfillmentType === "DELIVERY") {
    // Update order location
    const defaultLocation =
      order.buyer.location?.[0] ||
      order.buyer.location?.[1] ||
      order.buyer.location?.[2] ||
      order.location;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        location: defaultLocation,
      },
    });

    await prisma.message.create({
      data: {
        body: producerBody,
        messageOrder: "BUYER_PROPOSED_TIME",
        conversation: {
          connect: { id: conversation.id },
        },
        sender: {
          connect: { id: order.buyer.id },
        },
      },
      include: {
        sender: true,
      },
    });
    // Send push notification
    try {
      if (order.seller.subscriptions) {
        const formatrecipients = JSON.parse(order.seller.subscriptions);
        await Promise.all(
          formatrecipients.map((subscription: PushSubscription) =>
            webPush.sendNotification(
              subscription,
              JSON.stringify({
                title: "You have a new order!",
                body: producerBody,
                id: conversation.id,
              }),
              {
                vapidDetails: {
                  subject: "mailto:ezhomesteading@gmail.com",
                  publicKey: process.env
                    .NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY as string,
                  privateKey: process.env.WEB_PUSH_PRIVATE_KEY as string,
                },
              }
            )
          )
        );
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  return conversation;
}

// Modified POST handler to use raw buffer approach
export async function POST(request: NextRequest) {
  try {
    console.log("Webhook request received");

    // Log all headers for debugging
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    // Get the Stripe signature header
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      console.error("Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    // CRITICAL FIX: Use clone and read as buffer to avoid body parsing issues
    const clonedRequest = request.clone();
    const buffer = await clonedRequest.arrayBuffer();
    const rawBody = Buffer.from(buffer).toString("utf8");

    // Log verification details for debugging
    console.log("Stripe Signature:", sig);
    console.log("Raw Body Preview:", rawBody.substring(0, 100) + "...");
    console.log("Raw Body Length:", rawBody.length);
    console.log(
      "Webhook Secret (length):",
      endpointSecret ? endpointSecret.length : "missing"
    );

    let event: Stripe.Event;

    try {
      // Verify with raw buffer body
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (mainErr: any) {
      console.error(`Webhook verification failed: ${mainErr.message}`);

      // Enhanced error logging
      console.error("Error details:", {
        name: mainErr.name,
        type: mainErr.type,
        message: mainErr.message,
        partialStack: mainErr.stack?.substring(0, 300),
      });

      // Try to see if body modification is the issue
      try {
        const parsedBody = JSON.parse(rawBody);
        console.log("Event API version:", parsedBody.api_version);

        // Try with event's API version if different
        if (parsedBody.api_version && parsedBody.api_version !== "2023-10-16") {
          console.log(
            `Attempting with event's API version: ${parsedBody.api_version}`
          );

          // Create a temporary Stripe instance with that version
          const tempStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: parsedBody.api_version as any,
          });

          try {
            // Try verification again
            event = tempStripe.webhooks.constructEvent(
              rawBody,
              sig,
              endpointSecret
            );
            console.log("Verification succeeded with event's API version!");
          } catch (versionErr: any) {
            console.error(
              `Version-specific verification failed: ${versionErr.message}`
            );
          }
        } else {
          console.log("Event API version matches or is not specified");
        }
      } catch (parseErr) {
        console.error("Error parsing webhook body:", parseErr);
      }

      if (!event) {
        return NextResponse.json(
          { error: `Webhook Error: ${mainErr.message}` },
          { status: 400 }
        );
      }
    }

    // Signature verification succeeded, process the event
    console.log("Webhook event verified:", event.type);

    if (event.type === "payment_intent.succeeded") {
      try {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const buyerId = paymentIntent.metadata.userId;
        const orderGroupId = paymentIntent.metadata.orderGroupId;

        // Process this specific payment intent's basket
        const createdOrder = await handleBasketProcessing(
          buyerId,
          paymentIntent
        );

        // Process conversation and notification
        await createConversationAndNotify(createdOrder);

        // Update order group if it exists
        if (orderGroupId) {
          await prisma.orderGroup.update({
            where: {
              id: orderGroupId.replace(/['"]+/g, ""),
            },
            data: {
              orderids: {
                push: createdOrder.id.toString(),
              },
            },
          });
        }

        return NextResponse.json(
          { received: true, orderId: createdOrder.id },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error processing payment success:", error);
        return NextResponse.json(
          { error: "Failed to process payment success" },
          { status: 500 }
        );
      }
    }

    // Handle other webhook events if needed
    return NextResponse.json(
      { received: true, eventType: event.type },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
