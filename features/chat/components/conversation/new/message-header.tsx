// File: message-header.tsx
import React from "react";
import { MessageHeaderProps } from "./types";
import Link from "next/link";
import { HiChevronLeft } from "react-icons/hi";

export const MessageHeader: React.FC<MessageHeaderProps> = ({
  name,
  outfit,
  orderItemCount = 0,
  itemText,
  sellerRole,
  formattedPickupDate,
  totalPrice = 0,
}) => {
  return (
    <div className="fixed w-full z-10 sm:mt-[-64px] md:mt-[-50px] xl:mt-[-3rem]  lg:max-w-[calc(100%-320px)]">
      <div
        className={`${outfit.className} h-12  z-[10] bg-[#F1EFE7]  
        flex 
        border-b-[1px]
        pb-2
        px-4 
        lg:px-6 
        justify-between 
        
        items-center `}
      >
        <div className="flex items-center justify-center">
          <Link
            href="/chat"
            className="
            lg:hidden 
            block 
            transition 
            cursor-pointer
          "
          >
            <HiChevronLeft size={32} />
          </Link>
          <div className="text-xl font-medium pl-2 xl:p-0">{name}</div>
        </div>
      </div>
      <div
        className={`${outfit.className} h-6   px-10  border-b-[1px] z-[10] bg-[#F1EFE7]  flex justify-between items-center`}
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
          <div className="text-xs">Total: ${totalPrice / 100}</div>
        </div>
      </div>
    </div>
  );
};
