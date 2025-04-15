import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { IoMapOutline, IoStar } from "react-icons/io5";

interface BuyerDetailsProps {
  fulfillmentType?: string;
  onViewProfile: () => void;
  onGetDirections: () => void;
}

export const BuyerDetails: React.FC<BuyerDetailsProps> = memo(
  function BuyerDetails({ fulfillmentType, onViewProfile, onGetDirections }) {
    return (
      <div className="flex flex-col items-center justify-center space-y-1 w-full">
        {fulfillmentType === "DELIVERY" ? (
          <Button
            onClick={onGetDirections}
            className="w-full flex items-center gap-x-2 justify-between font-light text-sm"
          >
            <div>Get Directions</div> <IoMapOutline />
          </Button>
        ) : null}

        <Button
          className="w-full flex items-center gap-x-2 justify-between font-light text-sm"
          onClick={onViewProfile}
          title="View reviews of this buyer"
        >
          <div>View Reviews</div> <IoStar />
        </Button>
      </div>
    );
  }
);
