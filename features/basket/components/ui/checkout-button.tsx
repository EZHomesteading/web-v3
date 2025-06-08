"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addDays } from "date-fns";
import SoonExpiryModal from "../modals/soon-expiry-modal";
import { useRouter } from "next/navigation";
import axios from "axios";

interface CheckoutButtonProps {
  baskets: any[];
  pickupTimes: Record<string, Date> | null;
  basketTotals: {
    total: number;
    itemCount: number;
  };
  endLoc: any;
  startLoc: any;
}

interface AdjustedListing {
  listingId: string;
  title: string;
  sellerName: string;
  expiry: Date | null;
  soonValue: number;
}

const CheckoutButton = ({
  baskets,
  pickupTimes,
  basketTotals,
  endLoc,
  startLoc,
}: CheckoutButtonProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expiredArray, setExpiredArray] = useState<AdjustedListing[]>([]);
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const router = useRouter();

  const hasOutOfStock = baskets.some((basket) =>
    basket.items.some((item: any) => item.listing.stock <= 0)
  );

  const hasNotEnoughStock = baskets.some((basket) =>
    basket.items.some((item: any) => item.listing.stock <= item.quantity)
  );

  const createExpiryArray = () => {
    const expiryArray: AdjustedListing[] = [];

    baskets.forEach((basket) => {
      basket.items.forEach((item: any) => {
        const shelfLifeInDays = item.listing.shelfLife;
        const createdAt = new Date(item.listing.createdAt);
        const expiry =
          shelfLifeInDays !== -1 ? addDays(createdAt, shelfLifeInDays) : null;

        const percentExpiry = new Date(
          now.getTime() + shelfLifeInDays * 0.3 * 24 * 60 * 60 * 1000
        );

        const adjustedListing: AdjustedListing = {
          listingId: item.listing.id,
          title: item.listing.title,
          sellerName: basket.location.name || basket.location.user.name,
          expiry: expiry,
          soonValue: 0,
        };

        if (expiry && expiry < now) {
          adjustedListing.soonValue = 3;
          expiryArray.push(adjustedListing);
        } else if (expiry && expiry < threeDaysLater) {
          adjustedListing.soonValue = 1;
          expiryArray.push(adjustedListing);
        } else if (expiry && expiry < percentExpiry) {
          adjustedListing.soonValue = 2;
          expiryArray.push(adjustedListing);
        }
      });
    });

    return expiryArray;
  };

  const handleCheckout = () => {
    const expiryArr = createExpiryArray();

    if (!allTimesSet) {
      toast.error("Please set pickup or delivery times for all items", {
        duration: 2000,
        position: "bottom-right",
      });
      return;
    }

    if (hasOutOfStock) {
      toast.error("Some items in your basket are out of stock", {
        duration: 2000,
        position: "bottom-right",
      });
      return;
    }

    if (hasNotEnoughStock) {
      toast.error(
        "Some items in your basket do not have enough stock for your order.",
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
      return;
    }
    if (expiryArr.length > 0) {
      setExpiredArray(expiryArr);
      setConfirmOpen(true);
      return;
    }

    createOrder();
  };

  const createOrder = async () => {
    try {
      console.log("Starting checkout process...");
      console.log("Initial baskets:", baskets);
      console.log("Pickup times:", pickupTimes);

      const orderGroupResponse = await axios.post(
        "/api/useractions/checkout/create-group",
        {
          startLoc: startLoc,
          endLoc: endLoc,
        }
      );
      console.log(orderGroupResponse);
      const orderGroupId = orderGroupResponse.data.id;
      if (!orderGroupId) {
        return;
      }

      const updates = baskets
        .filter((basket) => {
          const hasPickupTime = Boolean(pickupTimes?.[basket.location.id]);
          const hasExistingFulfillmentDate = Boolean(basket.fulfillmentDate);

          const needsUpdate = hasPickupTime || hasExistingFulfillmentDate;

          console.log(`Basket ${basket.id} needs update:`, needsUpdate, {
            currentOrderMethod: basket.orderMethod,
            hasPickupTime,
            hasExistingFulfillmentDate,
            locationId: basket.location.id,
            pickupTime: pickupTimes?.[basket.location.id],
            existingFulfillmentDate: basket.fulfillmentDate,
          });
          return needsUpdate;
        })
        .map((basket) => {
          const pickupTime = pickupTimes?.[basket.location.id];
          const fulfillmentDate = pickupTime || basket.fulfillmentDate;

          const orderMethod = pickupTime ? "PICKUP" : basket.orderMethod;

          const update = {
            id: basket.id,
            orderMethod,
            fulfillmentDate,
            proposedLoc: basket.proposedLoc,
            timeType: basket.timeType,
            items: basket.items.map((item: any) => ({
              listingId: item.listing.id,
              quantity: item.quantity,
            })),
          };
          console.log(`Prepared update for basket ${basket.id}:`, update);
          return update;
        });

      console.log(`Prepared ${updates.length} basket updates:`, updates);

      if (updates.length > 0) {
        console.log("Sending batch update request...");
        const response = await axios.post("/api/baskets/batch-update", {
          updates,
        });

        console.log("Received response:", response.data);

        if (!response.data || response.status !== 200) {
          console.error("Invalid response:", response);
          throw new Error("Failed to update baskets");
        }
      }

      console.log("All updates successful, redirecting to checkout");
      router.push(`/checkout?orderGroupId=${orderGroupId}`);
    } catch (error) {
      console.error("Error updating baskets:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      }
      toast.error("Error preparing checkout. Please try again.", {
        duration: 2000,
        position: "bottom-right",
      });
    }
  };

  const allTimesSet = baskets.every((basket) => {
    const hasPickupTime = pickupTimes && pickupTimes[basket.location.id];
    const hasExistingFulfillmentDate = Boolean(basket.fulfillmentDate);

    const hasTime = hasPickupTime || hasExistingFulfillmentDate;

    console.log(`Checking times for basket ${basket.id}:`, {
      hasPickupTime: Boolean(hasPickupTime),
      hasExistingFulfillmentDate,
      hasTime,
      orderMethod: basket.orderMethod,
      pickupTime: pickupTimes?.[basket.location.id],
      fulfillmentDate: basket.fulfillmentDate,
    });

    return hasTime;
  });

  if (basketTotals.itemCount === 0) {
    return null;
  }

  let buttonStyle = "w-full mt-4";
  let buttonText = "Proceed to Checkout";

  if (!allTimesSet || hasOutOfStock) {
    buttonStyle += " bg-red-300 text-black hover:text-white hover:bg-red-600";
    buttonText = "Unable to Checkout";
  } else {
    buttonStyle += " bg-green-600 hover:bg-green-700 text-white";
  }

  return (
    <>
      <SoonExpiryModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        expiryArr={expiredArray}
        createOrder={createOrder}
      />
      {!allTimesSet ? (
        <div className="text-red-500">
          You must set delivery or pickup times for all items before proceeding
          to checkout
        </div>
      ) : null}
      {hasOutOfStock ? (
        <div className="text-red-500">
          One or more of the items in your cart are out of stock.
        </div>
      ) : hasNotEnoughStock ? (
        <div className="text-red-500">
          One or more of the items in your cart do not have enough stock to
          complete your order.
        </div>
      ) : null}

      <Button
        className={buttonStyle}
        onClick={handleCheckout}
        disabled={!allTimesSet || hasOutOfStock || hasNotEnoughStock}
      >
        {buttonText}
      </Button>
    </>
  );
};

export default CheckoutButton;
