//render market product cards on server, with toggle cart buttons
import { UserInfo } from "next-auth";
import Categories from "../../utils/categories";
import EmptyState from "@/components/EmptyState";
import { UserRole } from "@prisma/client";
<<<<<<<< HEAD:app/(nav)/(nav_market_layout)/market/(components)/market-component.tsx
import { MarketCard, MarketGrid } from "./market-components";
import { ListingWithLocAndUser } from "@/types";
========
import { MarketCard, MarketGrid } from "./market-grid";
>>>>>>>> origin:features/market/components/main/market-client.tsx

interface DayHours {
  date: string;
  timeSlots: TimeSlot[];
  capacity: number;
}
interface TimeSlot {
  open: number;
  close: number;
}

interface ShopProps {
  listings: ListingWithLocAndUser[];
  user?: UserInfo;
  basketItemIds: any[];
  params?: string;
}

const Market = ({ params, listings, user, basketItemIds }: ShopProps) => {
  let imageCount = 0;
  return (
    <>
      <div className={`sticky top-20 w-full border-b pb-2 bg-white z-content`}>
        <Categories />
      </div>
      {!listings ? (
        <EmptyState showReset />
      ) : (
        <MarketGrid>
          {listings?.map((listing, index) => (
            <MarketCard
              user={user}
              key={index}
              listing={listing}
              imageCount={imageCount}
              basketItemIds={basketItemIds}
              params={params}
            />
          ))}
        </MarketGrid>
      )}
    </>
  );
};

export default Market;
