import dynamic from "next/dynamic";
import { getCurrentUser } from "@/actions/getUser";
import { UserInfo } from "next-auth";
import { ListingWithLocAndUser } from "@/types";

export interface ShopProps {
  userId?: string;
  searchParams?: {
    q?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    page?: string;
    c?: string;
    p?: string;
    s?: string;
    ra?: string;
    pr?: string;
    category?: string;
    subcategory?: string;
  };
}

const MarketComponent = dynamic(
  () => import("@/features/market/components/main/market-client"),
  {
    ssr: true,
  }
);

// In this version, we'll properly await searchParams as Next.js requires
const ShopPage = async ({
  searchParams,
}: {
  searchParams?: ShopProps["searchParams"];
}) => {
  const apiUrl = process.env.API_URL;

  // Await searchParams to resolve the issue
  const resolvedParams = await Promise.resolve(searchParams || {});

  let user = await getCurrentUser();
  let basketItemIds: any = [];
  let listings: ListingWithLocAndUser[] = [];

  // Create params object using resolved search parameters
  const params = new URLSearchParams();

  // Only add parameters that exist
  if (resolvedParams.lat) params.append("lat", resolvedParams.lat);
  if (resolvedParams.lng) params.append("lng", resolvedParams.lng);
  if (resolvedParams.radius) params.append("radius", resolvedParams.radius);
  if (resolvedParams.category)
    params.append("category", resolvedParams.category);
  if (resolvedParams.subcategory)
    params.append("subcategory", resolvedParams.subcategory);
  if (resolvedParams.q) params.append("q", resolvedParams.q);

  const requests = [
    user?.id
      ? fetch(
          `${apiUrl}/get-many?collection=BasketItem&key=userId&value=${user.id}&fields=listingId`
        ).then((res) => res.json())
      : Promise.resolve([]),
    fetch(`${apiUrl}/v1/market?${params.toString()}`).then((res) => res.json()),
  ];
  const [basketItems, marketData] = await Promise.all(requests);

  basketItemIds = basketItems.items;
  listings = marketData.listings;

  return (
    <MarketComponent
      listings={listings}
      user={user as unknown as UserInfo}
      basketItemIds={basketItemIds || []}
      params={params.toString()}
    />
  );
};

export default ShopPage;
