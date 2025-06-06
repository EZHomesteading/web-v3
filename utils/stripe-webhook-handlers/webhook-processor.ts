import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

type WebhookEventHandler<T = any> = (
  eventData: T,
) => Promise<NextResponse | void>;

type WebhookHandlers = {
  [eventType: string]: WebhookEventHandler;
};

export async function webhookProcessor(
  request: NextRequest,
  stripe: Stripe,
  endpointSecret: string,
  handlers: WebhookHandlers,
): Promise<NextResponse> {
  const requestId = Math.random().toString(36).substring(7);
  console.log(
    `🔵 [${requestId}] Webhook received at:`,
    new Date().toISOString(),
  );
  console.log(`🌐 [${requestId}] Request method:`, request.method);
  console.log(`🌐 [${requestId}] Request URL:`, request.url);

  const sig = request.headers.get("stripe-signature");
  console.log(`🔑 [${requestId}] Stripe signature present:`, !!sig);

  if (!sig) {
    console.error(`❌ [${requestId}] Missing Stripe signature`);
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  let rawBody: string;

  try {
    console.log(`📝 [${requestId}] Reading request body...`);
    rawBody = await request.text();
    console.log(`📝 [${requestId}] Raw body length:`, rawBody.length);
    console.log(
      `📝 [${requestId}] Body preview:`,
      rawBody.substring(0, 200) + "...",
    );

    console.log(`🔐 [${requestId}] Constructing Stripe event...`);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log(`✅ [${requestId}] Event constructed successfully`);
  } catch (err: any) {
    console.error(
      `❌ [${requestId}] Webhook signature verification failed:`,
      err,
    );
    console.error(`❌ [${requestId}] Error name:`, err.name);
    console.error(`❌ [${requestId}] Error message:`, err.message);
    console.error(`❌ [${requestId}] Error stack:`, err.stack);
    console.error(
      `❌ [${requestId}] Signature used:`,
      sig?.substring(0, 50) + "...",
    );
    console.error(
      `❌ [${requestId}] Endpoint secret configured:`,
      !!endpointSecret,
    );
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  // Log event details
  console.log(`📨 [${requestId}] Event type:`, event.type);
  console.log(`🆔 [${requestId}] Event ID:`, event.id);
  console.log(
    `🕐 [${requestId}] Event created:`,
    new Date(event.created * 1000).toISOString(),
  );
  console.log(`🔄 [${requestId}] Event livemode:`, event.livemode);
  console.log(`📊 [${requestId}] Event object type:`, event.data.object.object);

  // Log if this event type has a handler
  const handler = handlers[event.type];
  console.log(`🎯 [${requestId}] Handler exists for ${event.type}:`, !!handler);
  console.log(`📋 [${requestId}] Available handlers:`, Object.keys(handlers));

  if (handler) {
    console.log(`🚀 [${requestId}] Starting handler for:`, event.type);
    console.log(
      `📦 [${requestId}] Event data object ID:`,
      event.data.object.id,
    );

    // Log specific data for payment intents
    if (event.type.startsWith("payment_intent")) {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`💳 [${requestId}] Payment Intent details:`, {
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        customer: pi.customer,
        metadataKeys: Object.keys(pi.metadata || {}),
        metadataCount: Object.keys(pi.metadata || {}).length,
      });

      // Log metadata existence
      if (pi.metadata) {
        console.log(`📋 [${requestId}] Metadata structure:`, {
          hasOrderMeta: !!pi.metadata.order_meta,
          hasUserMeta: !!pi.metadata.user_meta,
          hasBasketMeta: !!pi.metadata.basket_meta,
          hasNotes: !!pi.metadata.notes,
          itemCount: Object.keys(pi.metadata).filter((k) => k.startsWith("id_"))
            .length,
        });
      }
    }

    try {
      console.log(
        `⏱️ [${requestId}] Handler execution started at:`,
        new Date().toISOString(),
      );
      const startTime = Date.now();

      const result = await handler(event.data.object);

      const executionTime = Date.now() - startTime;
      console.log(
        `✅ [${requestId}] Handler completed successfully in ${executionTime}ms`,
      );
      console.log(
        `📤 [${requestId}] Handler result:`,
        result ? "Custom response" : "Default response",
      );

      return result || NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
      const executionTime = Date.now() - (Date.now() - 1000); // Approximate
      console.error(
        `❌ [${requestId}] Error processing ${event.type} after ~${executionTime}ms:`,
        error,
      );
      console.error(`❌ [${requestId}] Error name:`, error.name);
      console.error(`❌ [${requestId}] Error message:`, error.message);
      console.error(`❌ [${requestId}] Error stack:`, error.stack);
      console.error(`❌ [${requestId}] Error code:`, error.code);

      // Log additional error details if available
      if (error.cause) {
        console.error(`❌ [${requestId}] Error cause:`, error.cause);
      }

      // Log the event data that caused the error
      console.error(`📊 [${requestId}] Event data that caused error:`, {
        eventType: event.type,
        eventId: event.id,
        objectId: event.data.object.id,
        objectType: event.data.object.object,
      });

      return NextResponse.json(
        {
          error: `Failed to process ${event.type}`,
          eventId: event.id,
          requestId: requestId,
        },
        { status: 500 },
      );
    }
  } else {
    console.log(
      `⏭️ [${requestId}] No handler for event type: ${event.type}, responding with 200`,
    );
  }

  console.log(`✅ [${requestId}] Webhook processing completed successfully`);
  return NextResponse.json({ received: true }, { status: 200 });
}
