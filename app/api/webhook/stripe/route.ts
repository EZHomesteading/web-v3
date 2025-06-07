import { handlePaymentIntentAmountCapturable } from "@/utils/stripe-webhook-handlers/payment-intent-amount-capturable-updated";
import { webhookProcessor } from "@/utils/stripe-webhook-handlers/webhook-processor";
import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const bing = async () => {
  console.log("okay");
};
export async function POST(request: NextRequest) {
  return webhookProcessor(request, stripe, endpointSecret, {
    "payment_intent.amount_capturable_updated":
      handlePaymentIntentAmountCapturable,
    "payment_intent.created": bing,
  });
}
