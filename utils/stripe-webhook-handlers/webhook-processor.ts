import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

type WebhookEventHandler<T = any> = (eventData: T) => Promise<NextResponse | void>;

type WebhookHandlers = {
  [eventType: string]: WebhookEventHandler;
};

export async function webhookProcessor(
  request: NextRequest,
  stripe: Stripe,
  endpointSecret: string,
  handlers: WebhookHandlers
): Promise<NextResponse> {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  const handler = handlers[event.type];
  if (handler) {
    try {
      const result = await handler(event.data.object);
      return result || NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
      console.error(`Error processing ${event.type}:`, error);
      return NextResponse.json({ error: `Failed to process ${event.type}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
