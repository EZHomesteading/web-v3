// File: message-header.tsx
import React from "react";
import { MessageHeaderProps } from "./types";

export const MessageHeader: React.FC<MessageHeaderProps> = ({
  outfit,
  orderItemCount = 0,
  itemText,
  sellerRole,
  formattedPickupDate,
  totalPrice = 0,
}) => {
  return (
    <div
      className={`${outfit.className} h-6 mt-[50px] sm:mt-[-1px] px-10 w-full border-b-[1px] lg:max-w-[calc(100%-320px)] z-[10] bg-[#F1EFE7] fixed flex justify-between items-center`}
    >
      <div className="flex items-center gap-x-1 text-xs text-neutral-600 pl-3">
        <div>
          {orderItemCount} {itemText}
        </div>
        <div className="h-1 w-1 bg-neutral-600 rounded-full"></div>
        <div>
          <div className="text-xs">
            {sellerRole === "PRODUCER" ? "Drop off time:" : "Pickup time:"}{" "}
            {formattedPickupDate}
          </div>
        </div>
        <div className="h-1 w-1 bg-neutral-600 rounded-full"></div>
        <div className="text-xs">Total: ${totalPrice}</div>
      </div>
    </div>
  );
};
