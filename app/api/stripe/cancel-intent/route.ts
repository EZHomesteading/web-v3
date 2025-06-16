import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment ID is required",
        },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    if (paymentIntent.status === "requires_capture") {
      const canceledPaymentIntent = await stripe.paymentIntents.cancel(
        paymentId
      );

      return NextResponse.json({
        success: true,
        action: "canceled",
        paymentIntent: canceledPaymentIntent,
      });
    } else if (paymentIntent.status === "succeeded") {
      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
      });

      return NextResponse.json({
        success: true,
        action: "refunded",
        refund,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Cannot cancel payment intent with status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      });
    }
  } catch (error) {
    console.error("Error handling payment cancellation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
