import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { paymentId, orderId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment ID is required",
        },
        { status: 400 }
      );
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    if (paymentIntent.status === "requires_capture") {
      // Capture the authorized payment
      const capturedPaymentIntent = await stripe.paymentIntents.capture(
        paymentId
      );

      return NextResponse.json({
        success: true,
        action: "captured",
        paymentIntent: capturedPaymentIntent,
        orderId: orderId,
      });
    } else if (paymentIntent.status === "succeeded") {
      // Payment was already captured
      return NextResponse.json({
        success: true,
        action: "already_captured",
        message: "Payment was already captured",
        paymentIntent: paymentIntent,
        orderId: orderId,
      });
    } else {
      // Payment cannot be captured (wrong status)
      return NextResponse.json({
        success: false,
        message: `Cannot capture payment intent with status: ${paymentIntent.status}`,
        status: paymentIntent.status,
        orderId: orderId,
      });
    }
  } catch (error) {
    console.error("Error capturing payment:", error);
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
