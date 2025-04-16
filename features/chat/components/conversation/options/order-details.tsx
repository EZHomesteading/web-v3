import React, { memo } from "react";
import Image from "next/image";
import { Listing } from "../new/types";

interface OrderDetailsProps {
  listings: Listing[];
  getQuantity: (listingId: string) => number | null;
  router: any;
}

export const OrderDetails: React.FC<OrderDetailsProps> = memo(
  function OrderDetails({ listings, getQuantity, router }) {
    return (
      <div className="space-y-4">
        {listings.map((listing: Listing) => (
          <div
            key={listing.id}
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => router.push(`/listings/${listing.id}`)}
          >
            <div className="flex-shrink-0">
              <Image
                src={listing.images[0] || "/placeholder.jpg"}
                alt={listing.title}
                width={64}
                height={64}
                className="rounded-md object-cover aspect-square"
              />
            </div>
            <div className="flex-grow">
              <p className="font-normal">{listing.title}</p>
              <p className="text-xs font-extralight text-gray-700">
                ${listing.price} per {listing.unit}
              </p>
              <p className="text-xs font-extralight text-gray-700">
                {getQuantity(listing.id)} {listing.unit} for $
                {(getQuantity(listing.id) || 0) * listing.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }
);
