"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { OutfitFont } from "@/components/fonts";
import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import PaymentComponent from "./payment-component";
import axios from "axios";
import { formatDate } from "@/utils/time-managers";
import { useSearchParams } from "next/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

interface CheckoutFormProps {
  baskets?: any[];
  user: {
    id: string;
    name: string;
    email: string;
    stripeCustomerId?: string;
    loc?: any;
  };
}

interface PaymentIntentData {
  clientSecret: string;
  basketId: string;
  totalAmount: number;
}

const MobilePriceSummary = ({ formattedTotal }: { formattedTotal: number }) => {
  return (
    <Popover className="fixed inset-x-0 bottom-0 flex flex-col-reverse text-sm font-medium text-gray-900 lg:hidden">
      <div className="relative z-10 border-t border-gray-200 bg-white px-4 sm:px-6">
        <div className="mx-auto max-w-lg">
          <Popover.Button className="flex w-full items-center py-6 font-medium">
            <span className="mr-auto text-base">Total</span>
            <span className="mr-2 text-base">${formattedTotal}</span>
            <ChevronUpIcon
              className="h-5 w-5 text-gray-500"
              aria-hidden="true"
            />
          </Popover.Button>
        </div>
      </div>

      <Transition.Root as={Fragment}>
        <div>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Overlay className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <Popover.Panel className="relative bg-white px-4 py-6 sm:px-6">
              <dl className="mx-auto max-w-lg space-y-6">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd>${formattedTotal}</dd>
                </div>
              </dl>
            </Popover.Panel>
          </Transition.Child>
        </div>
      </Transition.Root>
    </Popover>
  );
};

export default function CheckoutForm({ baskets, user }: CheckoutFormProps) {
  if (!baskets) baskets = [];
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const orderGroupId = searchParams.get("orderGroupId");

  const calculateTotals = () => {
    if (!baskets) return;
    return baskets.reduce((acc, basket) => {
      const basketTotal = basket.items.reduce(
        (sum: number, item: any) =>
          sum + (item.listing.price / 100) * item.quantity,
        0,
      );
      return acc + basketTotal;
    }, 0);
  };

  const total = calculateTotals();
  const formattedTotal = Round(total, 2);

  function Round(value: number, precision: number) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  useEffect(() => {
    const fetchPaymentIntents = async () => {
      setError(null);

      try {
        const intents: PaymentIntentData[] = [];

        console.log("Order Group ID:", orderGroupId);

        for (const basket of baskets) {
          const basketTotal = basket.items.reduce(
            (sum: number, item: any) =>
              sum + item.listing.price * item.quantity,
            0,
          );

          const sellerId = basket.location.user.id;
          const sellerResponse = await fetch(`/api/users/${sellerId}`);

          if (!sellerResponse.ok) {
            throw new Error(
              `Failed to fetch user: ${sellerResponse.statusText}`,
            );
          }

          const seller = await sellerResponse.json();
          const sellerStripeID = seller?.data.stripeAccountId;

          const items = basket.items.map((item: any) => ({
            id: item.listing.id,
            quantity: item.quantity,
            price: item.listing.price,
            title: item.listing.title,
            unit: item.listing.unit,
            image: item.listing.images?.[0] || "",
          }));

          const requestPayload = {
            items,
            basketPayload: {
              id: basket.id,
              proposedLoc: basket.proposedLoc,
              fulfillmentDate: basket.fulfillmentDate,
              orderMethod: basket.orderMethod,
              status: basket.status,
              timeType: basket.timeType,
              orderGroupId: orderGroupId || undefined,
            },
            orderPayload: {
              storeId: basket.location.id,
              storeName: basket.location.name || basket.location.user.name,
              totalAmount: basketTotal,
              currency: "usd",
              stripeAccountId: sellerStripeID,
              notes: basket.notes || "",
              description: `Order from ${basket.location.name || basket.location.user.name}`,
            },
            customerPayload: {
              name: user.name,
              email: user.email,
              id: user.id,
              stripeCustomerId: user?.stripeCustomerId,
            },
          };

          const response = await axios.post(
            "/api/stripe/create-payment-intent",
            requestPayload,
          );

          intents.push({
            clientSecret: response.data.clientSecret,
            basketId: basket.id,
            totalAmount: basketTotal,
          });
        }

        setPaymentIntents(intents);
      } catch (error) {
        console.error("Error creating payment intents:", error);
        setError(
          "Failed to initialize checkout. Please try refreshing the page.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (baskets.length > 0) {
      fetchPaymentIntents();
    }
  }, [baskets, user, orderGroupId]);

  if (isLoading) {
    return (
      <div
        className={`${OutfitFont.className} flex items-center justify-center h-screen`}
      >
        <p className="text-xl">Loading checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${OutfitFont.className} flex items-center justify-center h-screen`}
      >
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="">
      <div
        className="fixed left-0 top-0 hidden h-full w-1/2 bg-white lg:block"
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 hidden h-full w-1/2 bg-gray-50 lg:block"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 xl:gap-x-48">
        <h1 className="sr-only">Order information</h1>

        <section
          aria-labelledby="summary-heading"
          className={`${OutfitFont.className} bg-gray-50 px-4 pb-10 pt-16 sm:px-6 lg:col-start-2 lg:row-start-1 lg:bg-transparent lg:px-0 lg:pb-16`}
        >
          <div className="mx-auto max-w-lg lg:max-w-none">
            <h2
              id="summary-heading"
              className="text-lg font-medium text-gray-900 mb-6"
            >
              Order summary
            </h2>

            <div className="space-y-6">
              {baskets.map((basket, index) => (
                <div
                  key={basket.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  {/* Basket Header */}
                  <div className="flex flex-col gap-2 mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">
                        {basket.location.name || basket.location.user.name}
                      </h3>
                      <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        $
                        {basket.items
                          .reduce(
                            (sum: number, item: any) =>
                              sum + (item.listing.price / 100) * item.quantity,
                            0,
                          )
                          .toFixed(2)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      {basket.fulfillmentDate ? (
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                            basket.orderMethod === "PICKUP"
                              ? "text-green-700 bg-green-50"
                              : "text-blue-700 bg-blue-50"
                          }`}
                        >
                          {basket.orderMethod === "PICKUP" ? (
                            <>
                              📦 Pickup:{" "}
                              {formatDate(new Date(basket.fulfillmentDate))}
                            </>
                          ) : (
                            <>
                              🚚 Delivery:{" "}
                              {formatDate(new Date(basket.fulfillmentDate))}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md">
                          <span className="text-xs">⏰</span>
                          No fulfillment time set
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basket Items */}
                  <ul className="divide-y divide-gray-100 space-y-0">
                    {basket.items.map((item: any) => (
                      <li
                        key={item.listing.id}
                        className="flex py-3 gap-3 first:pt-0 last:pb-0"
                      >
                        <div className="h-16 w-16 flex-none relative">
                          <Image
                            src={item.listing.images[0]}
                            alt={item.listing.title}
                            fill
                            className="rounded-md object-cover"
                            sizes="64px"
                            priority={true}
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-center">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-gray-900 text-sm leading-tight">
                                {item.listing.title}
                              </h4>
                              <p className="mt-1 text-xs text-gray-500">
                                {item.quantity}{" "}
                                {item.listing.unit || item.listing.subcateory}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                              $
                              {(
                                (item.quantity * item.listing.price) /
                                100
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Total Section */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <dt className="text-lg font-semibold text-gray-900">Total</dt>
                <dd className="text-lg font-bold text-gray-900">
                  ${formattedTotal}
                </dd>
              </div>
            </div>
          </div>
        </section>

        <div className="px-4 pb-36 pt-16 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0 lg:pb-16">
          <div className="mx-auto max-w-lg lg:max-w-none">
            {paymentIntents.length > 0 ? (
              <Elements
                options={{
                  clientSecret: paymentIntents[0].clientSecret,
                }}
                stripe={stripePromise}
              >
                <PaymentComponent
                  userEmail={user.email}
                  paymentIntents={paymentIntents}
                />
              </Elements>
            ) : (
              <div
                className={`${OutfitFont.className} text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8`}
              >
                <div className="animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <p className="text-lg text-gray-600">
                    Setting up payment processing...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will only take a moment
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <MobilePriceSummary formattedTotal={formattedTotal} />
    </div>
  );
}
