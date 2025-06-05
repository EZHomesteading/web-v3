//payment intent API
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: NextRequest) {
  const {
    totalSum,
    userId,
    orderTotals,
    basketId,
    body,
    email,
    orderId,
    orderGroupId,
    sellerStripeID,
  } = await request.json();
  console.log(sellerStripeID);
  if (!sellerStripeID) {
    return NextResponse.json({ error: "NOSELLERID" }, { status: 503 });
  }
  try {
    if (orderId === null) {
      console.error("Error creating PaymentIntent:");
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
    //const order = await getOrderById(orderId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalSum,
      currency: "usd",
      statement_descriptor_suffix: "EZHomesteading",
      description: JSON.stringify(body),
      metadata: {
        userId,
        orderGroupId: JSON.stringify(orderGroupId),
        sellerStripeID,
        basketId,
      },
      receipt_email: email,
      capture_method: "manual",
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
