import { proposedLoc } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

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
}

interface PaymentRequest {
  items: StripePaymentIntentListing[];
  basketPayload: BasketPayload;
  orderPayload: OrderPayload;
  customerPayload: CustomerPayload;
}

async function saveOrderMetadataToDB(
  order: PaymentRequest,
  piId: string,
): Promise<string> {
  return "order_meta_abc123";
}

async function resolveStripeCustomerId(req: PaymentRequest): Promise<string> {
  if (req.customerPayload?.stripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(
        req.customerPayload.stripeCustomerId,
      );
      return existingCustomer.id;
    } catch (error) {
      console.error("Error retrieving existing customer:", error);
      throw new Error("Invalid customer ID provided");
    }
  }

  const customerParams: Stripe.CustomerCreateParams = {};

  if (req.customerPayload?.name) {
    customerParams.name = req.customerPayload.name;
  }

  if (req.customerPayload?.email) {
    customerParams.email = req.customerPayload.email;
  }

  try {
    const newCustomer = await stripe.customers.create(customerParams);

    // TODO: update user in db

    return newCustomer.id;
  } catch (error) {
    console.error("Error creating new customer:", error);
    throw new Error("Failed to create customer account");
  }
}

async function createPaymentIntentWithMetadata(
  order: PaymentRequest,
  customerId: string,
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
    params.transfer_data = {
      destination: order.orderPayload.stripeAccountId,
    };
  }

  if (order.items.length > 40) {
    const pi = await stripe.paymentIntents.create(params);

    const metaId = await saveOrderMetadataToDB(order, pi.id);

    await stripe.paymentIntents.update(pi.id, {
      metadata: {
        order_ref: metaId,
      },
    });

    return pi;
  }

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

  if (order.orderPayload.notes) {
    meta.notes = order.orderPayload.notes;
  }

  order.items.forEach((item) => {
    const metaKey = `id_${item.id}`;
    meta[metaKey] = {
      t: item.title,
      u: item.unit,
      p: item.price,
      q: item.quantity,
      i: item.image,
    };
  });

  Object.keys(meta).forEach((key) => {
    params.metadata![key] = JSON.stringify(meta[key]);
  });

  return await stripe.paymentIntents.create(params);
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    if (
      !requestData.items ||
      !requestData.basketPayload ||
      !requestData.orderPayload ||
      !requestData.customerPayload
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: items, basketPayload, orderPayload, or customerPayload",
        },
        { status: 400 },
      );
    }

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
      },
    };

    const customerId = await resolveStripeCustomerId(req);

    const paymentIntent = await createPaymentIntentWithMetadata(
      req,
      customerId,
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeCustomerId: customerId,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
