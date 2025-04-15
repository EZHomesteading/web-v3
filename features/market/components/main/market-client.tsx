//render market product cards on server, with toggle cart buttons
import { UserInfo } from "next-auth";
import Categories from "../../utils/categories";
import EmptyState from "@/components/EmptyState";
import { MarketCard, MarketGrid } from "./market-grid";
import { ListingWithLocAndUser } from "@/types";

interface ShopProps {
  listings: ListingWithLocAndUser[];
  user?: UserInfo;
  basketItemIds: any[];
  params?: string;
}

const Shop = ({ params, listings, user, basketItemIds }: ShopProps) => {
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

export default Shop;
