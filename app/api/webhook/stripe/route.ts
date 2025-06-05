import { handlePaymentIntentAmountCapturable } from "@/utils/webhook-handlers/payment-intent-amount-capturable-update";
import { webhookProcessor } from "@/utils/webhook-handlers/webhook-processor";
import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  return webhookProcessor(request, stripe, endpointSecret, {
    "payment_intent.amount_capturable_updated": handlePaymentIntentAmountCapturable,
  });
}
