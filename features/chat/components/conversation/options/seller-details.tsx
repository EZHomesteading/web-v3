import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { IoMapOutline, IoStorefrontOutline } from "react-icons/io5";
import { ChatMessage } from "chat-types";

interface SellerDetailsProps {
  fulfillmentType?: string;
  lastMessage: ChatMessage;
  orderGroupId: string | null;
  onGetDirections: () => void;
  onVisitStore: () => void;
  onViewMapCheckout: () => void;
}

export const SellerDetails: React.FC<SellerDetailsProps> = memo(
  function SellerDetails({
    fulfillmentType,
    lastMessage,
    orderGroupId,
    onGetDirections,
    onVisitStore,
    onViewMapCheckout,
  }) {
    const isOrderFinished =
      lastMessage.messageOrder === "COMPLETED" ||
      lastMessage.messageOrder === "CANCELED" ||
      lastMessage.messageOrder === "REFUNDED";

    return (
      <div className="flex flex-col items-center justify-center space-y-1 w-full">
        {fulfillmentType === "DELIVERY" ? (
          <Button
            onClick={onVisitStore}
            className="w-full flex gap-x-2 items-center justify-between font-light text-sm"
          >
            <div>Visit Store</div>
            <IoStorefrontOutline />
          </Button>
        ) : (
          <>
            {!isOrderFinished && (
              <Button
                onClick={onViewMapCheckout}
                className="w-full flex items-center gap-x-2 justify-between font-light text-sm"
              >
                <div>Get Directions</div> <IoMapOutline />
              </Button>
            )}

            <Button
              onClick={onVisitStore}
              className="w-full flex gap-x-2 items-center justify-between font-light text-sm"
            >
              <div>Visit Store</div>
              <IoStorefrontOutline />
            </Button>
          </>
        )}
      </div>
    );
  }
);
