//my listing page parent element
import EmptyState from "@/components/EmptyState";
import ClientOnly from "@/components/client/ClientOnly";
import { currentUser } from "@/lib/auth";
import { GetListingsByUserId } from "@/actions/getListings";
import ListingsClient from "./ListingsClient";
import { getUserWithSellOrders } from "@/actions/getUser";
import Stripe from "stripe";
import { parse } from "json5";
function processOrderQuantities(orders: any) {
  const quantityMap = new Map();

  orders.forEach((order: any) => {
    try {
      const quantityData = parse(order.quantity);
      quantityData.forEach((item: any) => {
        const { id, quantity } = item;
        const currentQuantity = quantityMap.get(id) || 0;
        quantityMap.set(id, currentQuantity + quantity);
      });
    } catch (error) {
      console.error(`Error parsing quantity for order: ${order.id}`, error);
    }
  });

  const orderQuantities = Array.from(
    quantityMap,
    ([listingId, totalQuantity]) => ({
      listingId,
      totalQuantity,
    })
  );

  return orderQuantities;
}
const PropertiesPage = async () => {
  const user = await currentUser();
  if (!user) {
    return <EmptyState title="Unauthorized" subtitle="Please login" />;
  }
  const seller = await getUserWithSellOrders({ userId: user?.id });
  const orders = seller?.sellerOrders.filter((order) => order.status);
  const orderQuantities = processOrderQuantities(orders);
  const userId = user.id;
  const listings = await GetListingsByUserId({ userId });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
  async function checkPayoutCapability(stripeAccountId: string) {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      return account.capabilities?.transfers === "active";
    } catch (error) {
      console.error("Error checking payout capability:", error);
      return null;
    }
  }

  let stripeAccountId = user.stripeAccountId;
  let canReceivePayouts = false;

  if (!stripeAccountId && (user.role === "PRODUCER" || user.role === "COOP")) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/create-connected-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user?.id }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create Stripe account");
      }
      const data = await response.json();
      stripeAccountId = data.stripeAccountId;
    } catch (error) {
      console.error("Error creating Stripe account:", error);
    }
  }

  if (stripeAccountId) {
    canReceivePayouts = (await checkPayoutCapability(stripeAccountId)) || false;
  }

  if (listings.listings.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No products found"
          subtitle="You dont have any items in your store"
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <ListingsClient
        canReceivePayouts={canReceivePayouts}
        listings={listings.listings}
        orderQuantities={orderQuantities}
        user={user}
      />
    </ClientOnly>
  );
};

export default PropertiesPage;
