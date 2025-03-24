import dynamic from "next/dynamic";
import { getCurrentUser } from "@/actions/getUser";
import { UserInfo } from "next-auth";
<<<<<<<< HEAD:app/(nav)/(nav_market_layout)/market/page.tsx
import { ListingWithLocAndUser } from "@/types";
========
import { MarketListing } from "@/features/market/components/main/market-client";
>>>>>>>> origin:app/(nav)/market/page.tsx

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
<<<<<<<< HEAD:app/(nav)/(nav_market_layout)/market/page.tsx
  () =>
    import(
      "@/app/(nav)/(nav_market_layout)/market/(components)/market-component"
    ),
========
  () => import("@/features/market/components/main/market-client"),
>>>>>>>> origin:app/(nav)/market/page.tsx
  {
    ssr: true,
  }
);

export default async function MarketPage({
  searchParams,
}: {
  searchParams?: ShopProps["searchParams"];
}) {
  const apiUrl = process.env.API_URL;

  // Await the search parameters
  const resolvedSearchParams = await searchParams;

  let user = await getCurrentUser();
  let basketItemIds: any = [];
  let listings: ListingWithLocAndUser[] = [];

  const params = new URLSearchParams({
    ...(resolvedSearchParams?.lat && { lat: resolvedSearchParams.lat }),
    ...(resolvedSearchParams?.lng && { lng: resolvedSearchParams.lng }),
    ...(resolvedSearchParams?.radius && {
      radius: resolvedSearchParams.radius,
    }),
    ...(resolvedSearchParams?.category && {
      category: resolvedSearchParams.category,
    }),
    ...(resolvedSearchParams?.subcategory && {
      subcategory: resolvedSearchParams.subcategory,
    }),
    ...(resolvedSearchParams?.q && { q: resolvedSearchParams.q }),
  });

  const requests = [
    user?.id
      ? fetch(
          `${apiUrl}/get-many?collection=BasketItem&key=userId&value=${user.id}&fields=listingId`
        ).then((res) => res.json())
      : Promise.resolve([]),
    fetch(`${apiUrl}/market?${params.toString()}`).then((res) => res.json()),
  ];
  const [basketItems, marketData] = await Promise.all(requests);

  basketItemIds = basketItems.items;
  listings = marketData.items;

  return (
    <MarketComponent
      listings={listings}
      user={user as unknown as UserInfo}
      basketItemIds={basketItemIds || []}
      params={params.toString()}
    />
  );
}
