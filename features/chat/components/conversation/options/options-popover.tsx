// File: options/options-popover.tsx
import React, { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { OrderDetails } from "./order-details";
import { SellerDetails } from "./seller-details";
import { BuyerDetails } from "./buyer-details";
import { OrderOptions } from "./order-options";
import { OptionsPopoverProps } from "../new/types";
import { DialogTitle } from "@radix-ui/react-dialog";

export const OptionsPopover: React.FC<OptionsPopoverProps> = memo(
  function OptionsPopover({
    outfit,
    listings,
    order,
    otherUser,
    user,
    orderGroupId,
    router,
    lastMessage,
    cancel,
    dispute,
    escalate,
    refund,
    confirm,
    review,
    onOpenCancel,
    onOpenDispute,
    onOpenEscalate,
    onOpenRefund,
    onOpenConfirm,
  }) {
    const getQuantity = useCallback(
      (listingId: string) => {
        // Find the listing with the matching id
        const foundListing = order?.items?.find(
          (item: any) => item.listing.id === listingId
        );

        // Return the found listing quantity or null if not found
        return foundListing ? foundListing.quantity : null;
      },
      [order]
    );

    const handleViewProfile = useCallback(() => {
      router.push(`/profile/${order?.userId}`);
    }, [router, order]);

    const handleGetDirections = useCallback(() => {
      window.open(
        `http://maps.apple.com/?address=${order?.location?.address}`,
        "_blank"
      );
    }, [order]);

    const handleVisitStore = useCallback(() => {
      router.push(`/store/${otherUser?.url}`);
    }, [router, otherUser]);

    const handleViewMapCheckout = useCallback(() => {
      router.push(`/checkmap?orderGroupId=${orderGroupId}`);
    }, [router, orderGroupId]);

    return (
      <Popover>
        <PopoverTrigger
          asChild
          className="fixed right-4 top-1 md:top-[5rem] z-20"
        >
          <Button>More Options</Button>
        </PopoverTrigger>

        <PopoverContent className={`${outfit.className} mr-9`}>
          <div className="font-normal text-xl mb-3 border-b-[1px]">
            Order Details
          </div>

          <OrderDetails
            listings={listings}
            getQuantity={getQuantity}
            router={router}
          />

          <div className="font-normal text-xl my-3 border-b-[1px]">
            {user.id === order?.sellerId ? "Buyer Details" : "Seller Details"}
          </div>

          {user.id === order?.sellerId ? (
            <BuyerDetails
              fulfillmentType={order?.fulfillmentType}
              onViewProfile={handleViewProfile}
              onGetDirections={handleGetDirections}
            />
          ) : (
            <SellerDetails
              fulfillmentType={order?.fulfillmentType}
              lastMessage={lastMessage}
              orderGroupId={orderGroupId}
              onGetDirections={handleGetDirections}
              onVisitStore={handleVisitStore}
              onViewMapCheckout={handleViewMapCheckout}
            />
          )}

          <div className="font-normal text-xl my-3 border-b-[1px]">
            Order Options
          </div>

          <OrderOptions
            cancel={cancel}
            dispute={dispute}
            escalate={escalate}
            refund={refund && user.id === order?.sellerId}
            confirm={confirm}
            review={review}
            onOpenCancel={onOpenCancel}
            onOpenDispute={onOpenDispute}
            onOpenEscalate={onOpenEscalate}
            onOpenRefund={onOpenRefund}
            onOpenConfirm={onOpenConfirm}
            reviewedId={otherUser?.id}
            reviewerId={user?.id}
            orderId={order?.id}
            isBuyer={user.id !== order?.sellerId}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
