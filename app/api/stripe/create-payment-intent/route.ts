import { proposedLoc, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

console.log("🚀 Stripe Payment Intent API initialized");
console.log("📋 Stripe API Version:", "2025-04-30.basil");
console.log(
  "🔑 Stripe Secret Key (first 10 chars):",
  process.env.STRIPE_SECRET_KEY?.substring(0, 10)
);

interface StripePaymentIntentListing {
  id: string;
  quantity: number;
  price: number;
  image?: string;
  title?: string;
  unit?: string;
}

interface BasketPayload {
  id: string;
  proposedLoc: proposedLoc;
  fulfillmentDate?: Date;
  orderMethod?: string;
  status?: string;
  timeType?: string;
  orderGroupId?: string;
}

interface OrderPayload {
  storeId: string;
  storeName: string;
  totalAmount: number;
  currency: string;
  stripeAccountId: string;
  sellerId: string;
  notes?: string;
  description?: string;
}

interface CustomerPayload {
  name: string;
  email: string;
  id: string;
  stripeCustomerId?: string;
  timeZone: string;
}

interface PaymentRequest {
  items: StripePaymentIntentListing[];
  basketPayload: BasketPayload;
  orderPayload: OrderPayload;
  customerPayload: CustomerPayload;
}

async function saveOrderMetadataToDB(
  order: PaymentRequest,
  piId: string
): Promise<string> {
  const metaId = "order_meta_abc123";

  return metaId;
}

async function resolveStripeCustomerId(
  name: string,
  email: string
): Promise<string> {
  const customerParams: Stripe.CustomerCreateParams = {};

  if (name) {
    customerParams.name = name;
  }

  if (email) {
    customerParams.email = email;
  }

  try {
    const newCustomer = await stripe.customers.create(customerParams);
    return newCustomer.id;
  } catch (error) {
    throw new Error("Failed to create customer account");
  }
}

async function createPaymentIntentWithMetadata(
  order: PaymentRequest,
  customerId: string
): Promise<Stripe.PaymentIntent> {
  if (order.items.length === 0) {
    throw new Error("Order must have at least one item");
  }

  if (!order.orderPayload.currency) {
    order.orderPayload.currency = "usd";
  }

  const params: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(order.orderPayload.totalAmount),
    currency: order.orderPayload.currency,
    payment_method_types: ["card"],
    capture_method: "manual",
    customer: customerId,
    description: order.orderPayload.description,
    statement_descriptor_suffix: "EZHomesteading",
    metadata: {
      notes: order.orderPayload.notes || "",
    },
  };
  if (order.orderPayload.stripeAccountId) {
    console.log(
      "🏪 [createPaymentIntentWithMetadata] Adding transfer data for connected account"
    );
    console.log(
      "🏪 [createPaymentIntentWithMetadata] Destination account:",
      order.orderPayload.stripeAccountId
    );

    params.transfer_data = {
      destination: order.orderPayload.stripeAccountId,
    };

    console.log(
      "🏪 [createPaymentIntentWithMetadata] Transfer data added:",
      JSON.stringify(params.transfer_data, null, 2)
    );
  } else {
    console.log(
      "⚠️ [createPaymentIntentWithMetadata] No Stripe account ID provided, no transfer data added"
    );
  }

  if (order.items.length > 40) {
    console.log(
      "📊 [createPaymentIntentWithMetadata] Large order detected (>40 items), using DB metadata storage"
    );
    console.log(
      "📊 [createPaymentIntentWithMetadata] Creating payment intent first, then saving metadata to DB"
    );

    console.log(
      "💳 [createPaymentIntentWithMetadata] Creating payment intent with basic params..."
    );
    const pi = await stripe.paymentIntents.create(params);

    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent created successfully"
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent ID:",
      pi.id
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent status:",
      pi.status
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent amount:",
      pi.amount
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent customer:",
      pi.customer
    );

    console.log(
      "💾 [createPaymentIntentWithMetadata] Saving large order metadata to database..."
    );
    const metaId = await saveOrderMetadataToDB(order, pi.id);
    console.log(
      "💾 [createPaymentIntentWithMetadata] Metadata saved with ID:",
      metaId
    );

    console.log(
      "🔄 [createPaymentIntentWithMetadata] Updating payment intent with metadata reference..."
    );
    await stripe.paymentIntents.update(pi.id, {
      metadata: {
        order_ref: metaId,
      },
    });

    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent updated with metadata reference"
    );
    return pi;
  }

  console.log(
    "📋 [createPaymentIntentWithMetadata] Standard order size, embedding metadata directly"
  );
  console.log(
    "📋 [createPaymentIntentWithMetadata] Building comprehensive metadata object..."
  );

  const meta: Record<string, any> = {
    order_meta: {
      store_id: order.orderPayload.storeId,
      store_name: order.orderPayload.storeName,
      seller_id: order.orderPayload.sellerId,
      order_id: "TEMP_ORDER_ID",
      item_count: order.items.length,
      total_amt: order.orderPayload.totalAmount,
    },
    user_meta: {
      st_id: customerId,
      id: order.customerPayload.id,
      name: order.customerPayload.name,
      time_zone: order.customerPayload.timeZone,
    },
    basket_meta: {
      id: order.basketPayload.id,
      proposed_loc: order.basketPayload.proposedLoc,
      fulfillment_date: order.basketPayload.fulfillmentDate,
      order_method: order.basketPayload.orderMethod,
      status: order.basketPayload.status,
      time_type: order.basketPayload.timeType,
      order_group_id: order.basketPayload.orderGroupId,
    },
  };

  console.log("📋 [createPaymentIntentWithMetadata] Base metadata created:");
  console.log(
    "📋 [createPaymentIntentWithMetadata] - Order meta:",
    JSON.stringify(meta.order_meta, null, 2)
  );
  console.log(
    "📋 [createPaymentIntentWithMetadata] - User meta:",
    JSON.stringify(meta.user_meta, null, 2)
  );
  console.log(
    "📋 [createPaymentIntentWithMetadata] - Basket meta:",
    JSON.stringify(meta.basket_meta, null, 2)
  );

  if (order.orderPayload.notes) {
    console.log(
      "📝 [createPaymentIntentWithMetadata] Adding notes to metadata:",
      order.orderPayload.notes
    );
    meta.notes = order.orderPayload.notes;
  }

  console.log(
    "🛍️ [createPaymentIntentWithMetadata] Processing individual items for metadata..."
  );
  order.items.forEach((item, index) => {
    console.log(
      `🛍️ [createPaymentIntentWithMetadata] Processing item ${index + 1}/${
        order.items.length
      }:`
    );
    console.log(`🛍️ [createPaymentIntentWithMetadata] - ID: ${item.id}`);
    console.log(`🛍️ [createPaymentIntentWithMetadata] - Title: ${item.title}`);
    console.log(`🛍️ [createPaymentIntentWithMetadata] - Price: ${item.price}`);
    console.log(
      `🛍️ [createPaymentIntentWithMetadata] - Quantity: ${item.quantity}`
    );
    console.log(`🛍️ [createPaymentIntentWithMetadata] - Unit: ${item.unit}`);
    console.log(`🛍️ [createPaymentIntentWithMetadata] - Image: ${item.image}`);

    const metaKey = `id_${item.id}`;
    meta[metaKey] = {
      t: item.title,
      u: item.unit,
      p: item.price,
      q: item.quantity,
      i: item.image,
    };

    console.log(
      `🛍️ [createPaymentIntentWithMetadata] - Metadata key: ${metaKey}`
    );
    console.log(
      `🛍️ [createPaymentIntentWithMetadata] - Metadata value:`,
      JSON.stringify(meta[metaKey], null, 2)
    );
  });

  console.log(
    "📋 [createPaymentIntentWithMetadata] Converting metadata to JSON strings for Stripe..."
  );
  console.log(
    "📋 [createPaymentIntentWithMetadata] Total metadata keys before conversion:",
    Object.keys(meta).length
  );

  Object.keys(meta).forEach((key) => {
    const originalValue = meta[key];
    const jsonString = JSON.stringify(meta[key]);
    params.metadata![key] = jsonString;

    console.log(
      `📋 [createPaymentIntentWithMetadata] Converted key "${key}":`,
      {
        original: originalValue,
        jsonString: jsonString,
        length: jsonString.length,
      }
    );
  });

  console.log(
    "📋 [createPaymentIntentWithMetadata] Final metadata object for Stripe:"
  );
  console.log(
    "📋 [createPaymentIntentWithMetadata] Total metadata entries:",
    Object.keys(params.metadata!).length
  );
  console.log(
    "📋 [createPaymentIntentWithMetadata] Metadata keys:",
    Object.keys(params.metadata!)
  );

  console.log(
    "💳 [createPaymentIntentWithMetadata] Final payment intent params:",
    JSON.stringify(params, null, 2)
  );
  console.log(
    "💳 [createPaymentIntentWithMetadata] Making Stripe API call to create payment intent..."
  );

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent created successfully!"
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent ID:",
      paymentIntent.id
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent status:",
      paymentIntent.status
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent amount:",
      paymentIntent.amount
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent currency:",
      paymentIntent.currency
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent customer:",
      paymentIntent.customer
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent client secret (first 20 chars):",
      paymentIntent.client_secret?.substring(0, 20)
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent created timestamp:",
      paymentIntent.created
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent capture method:",
      paymentIntent.capture_method
    );
    console.log(
      "✅ [createPaymentIntentWithMetadata] Payment intent transfer data:",
      paymentIntent.transfer_data
    );

    return paymentIntent;
  } catch (error) {
    console.error(
      "❌ [createPaymentIntentWithMetadata] Error creating payment intent:",
      error
    );
    console.error(
      "❌ [createPaymentIntentWithMetadata] Error type:",
      typeof error
    );
    console.error(
      "❌ [createPaymentIntentWithMetadata] Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "❌ [createPaymentIntentWithMetadata] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    if (error instanceof Stripe.errors.StripeError) {
      console.error(
        "❌ [createPaymentIntentWithMetadata] Stripe error type:",
        error.type
      );
      console.error(
        "❌ [createPaymentIntentWithMetadata] Stripe error code:",
        error.code
      );
      console.error(
        "❌ [createPaymentIntentWithMetadata] Stripe error param:",
        error.param
      );
      console.error(
        "❌ [createPaymentIntentWithMetadata] Stripe error message:",
        error.message
      );
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log("🚀 [POST] ========== NEW PAYMENT INTENT REQUEST ==========");
  console.log("🚀 [POST] Request received at:", new Date().toISOString());
  console.log("🚀 [POST] Request method:", request.method);
  console.log("🚀 [POST] Request URL:", request.url);
  console.log(
    "🚀 [POST] Request headers:",
    Object.fromEntries(request.headers.entries())
  );

  try {
    console.log("📨 [POST] Parsing request body...");
    const requestData = await request.json();

    console.log("📨 [POST] Raw request data received:");
    console.log("📨 [POST] Request data keys:", Object.keys(requestData));
    console.log(
      "📨 [POST] Full request data:",
      JSON.stringify(requestData, null, 2)
    );

    console.log("✅ [POST] Request body parsed successfully");
    console.log("✅ [POST] Request data type:", typeof requestData);

    console.log("🔍 [POST] Validating required fields...");
    console.log("🔍 [POST] Items present:", !!requestData.items);
    console.log(
      "🔍 [POST] BasketPayload present:",
      !!requestData.basketPayload
    );
    console.log("🔍 [POST] OrderPayload present:", !!requestData.orderPayload);
    console.log(
      "🔍 [POST] CustomerPayload present:",
      !!requestData.customerPayload
    );

    if (
      !requestData.items ||
      !requestData.basketPayload ||
      !requestData.orderPayload ||
      !requestData.customerPayload
    ) {
      console.error("❌ [POST] Missing required fields");
      console.error("❌ [POST] Items:", requestData.items ? "✓" : "✗");
      console.error(
        "❌ [POST] BasketPayload:",
        requestData.basketPayload ? "✓" : "✗"
      );
      console.error(
        "❌ [POST] OrderPayload:",
        requestData.orderPayload ? "✓" : "✗"
      );
      console.error(
        "❌ [POST] CustomerPayload:",
        requestData.customerPayload ? "✓" : "✗"
      );

      return NextResponse.json(
        {
          error:
            "Missing required fields: items, basketPayload, orderPayload, or customerPayload",
        },
        { status: 400 }
      );
    }

    console.log("✅ [POST] All required fields present");
    console.log("🏗️ [POST] Building PaymentRequest object...");

    console.log("🏗️ [POST] Processing basketPayload...");
    console.log(
      "🏗️ [POST] Original fulfillmentDate:",
      requestData.basketPayload.fulfillmentDate
    );
    console.log(
      "🏗️ [POST] Original orderMethod:",
      requestData.basketPayload.orderMethod
    );

    const req: PaymentRequest = {
      items: requestData.items,
      basketPayload: {
        id: requestData.basketPayload.id,
        proposedLoc: requestData.basketPayload.proposedLoc,
        fulfillmentDate: requestData.basketPayload.fulfillmentDate
          ? new Date(requestData.basketPayload.fulfillmentDate)
          : undefined,
        orderMethod: requestData.basketPayload?.orderMethod || "PICKUP",
        status: requestData.basketPayload.status,
        timeType: requestData.basketPayload.timeType,
        orderGroupId: requestData.basketPayload.orderGroupId,
      },
      orderPayload: {
        totalAmount: requestData.orderPayload.totalAmount,
        currency: requestData.orderPayload.currency || "usd",
        sellerId: requestData.orderPayload.sellerId,
        storeId: requestData.orderPayload.storeId,
        storeName: requestData.orderPayload.storeName,
        description: requestData.orderPayload.description,
        stripeAccountId: requestData.orderPayload.stripeAccountId,
        notes: requestData.orderPayload.notes || "",
      },
      customerPayload: {
        id: requestData.customerPayload.id,
        name: requestData.customerPayload.name,
        email: requestData.customerPayload.email,
        stripeCustomerId: requestData.customerPayload.stripeCustomerId,
        timeZone: requestData.customerPayload.timeZone,
      },
    };

    const userStripeAccountId = await getUserStripeCustomerId(
      req.customerPayload.id
    );
    let customerId: string;
    if (userStripeAccountId === "" || userStripeAccountId === undefined) {
      customerId = await resolveStripeCustomerId(
        req.customerPayload.name,
        req.customerPayload.email
      );
    } else {
      customerId = userStripeAccountId;
    }

    if (!req.customerPayload.stripeCustomerId && customerId) {
      await updateUserStripeCustomerId(req.customerPayload.id, customerId);
    }

    const paymentIntent = await createPaymentIntentWithMetadata(
      req,
      customerId
    );

    const response = {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeCustomerId: customerId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 [POST] ========== ERROR OCCURRED ==========");
    console.error("💥 [POST] Error caught in main POST handler:", error);
    console.error("💥 [POST] Error type:", typeof error);
    console.error("💥 [POST] Error constructor:", error?.constructor?.name);
    console.error(
      "💥 [POST] Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "💥 [POST] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function updateUserStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeCustomerId: stripeCustomerId,
      },
    });
  } catch (error) {}
}

async function getUserStripeCustomerId(
  userId: string
): Promise<string | undefined> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) return "";

    return user.stripeCustomerId;
  } catch (error) {}
}
