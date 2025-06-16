import { getOrderByIdTransfer } from "@/actions/getOrder";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

interface TransferData {
  total: number;
  paymentId: string;
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { total, paymentId, orderId } = body as TransferData;

    // Get payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    console.log(paymentIntent);

    // Get order details
    const order = await getOrderByIdTransfer({ orderId: orderId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if payment intent already has transfer_data configured
    if (paymentIntent.transfer_data?.destination) {
      // Payment intent already has automatic transfer configured
      // Check if it matches the seller's account
      const expectedDestination = order.seller?.stripeAccountId;

      if (
        expectedDestination &&
        paymentIntent.transfer_data.destination === expectedDestination
      ) {
        return NextResponse.json({
          success: true,
          message: "Transfer already configured automatically",
          destination: paymentIntent.transfer_data.destination,
          automatic: true,
        });
      } else {
        return NextResponse.json(
          { error: "Transfer destination mismatch" },
          { status: 400 }
        );
      }
    } else {
      // Manual transfer required
      if (!order.seller?.stripeAccountId) {
        return NextResponse.json(
          { error: "Seller Stripe account not found" },
          { status: 400 }
        );
      }

      // Create manual transfer
      const transfer = await stripe.transfers.create({
        amount: total,
        currency: "usd",
        destination: order.seller.stripeAccountId,
        source_transaction: paymentIntent.latest_charge as string,
        description: `Transfer for order ${orderId}`,
      });

      return NextResponse.json({
        success: true,
        message: "Manual transfer initiated successfully",
        transfer,
        automatic: false,
      });
    }
  } catch (error) {
    console.error("Transfer error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Stripe error",
          message: error.message,
          type: error.type,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process transfer" },
      { status: 500 }
    );
  }
}
