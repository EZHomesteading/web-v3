import { OutfitFont } from "@/components/fonts";

import { Viewport } from "next";
import { Location } from "@/types";

import Link from "next/link";
import NewStoreClient from "@/features/new-store/main/new-store-client";

import authCache from "@/auth-cache";
import { getUserLocations } from "@/actions/getLocations";
import { createStripeConnectedAccount } from "@/actions/auth/new-stripe-acc";

export const viewport: Viewport = {
  themeColor: "#fff",
};

const apiKey = process.env.MAPS_KEY!;

export default async function Page() {
  const session = await authCache();
  if (!session) return;

  const locations = await getUserLocations({ userId: session?.user.id });
  if (!session?.user?.stripeAccountId) {
    createStripeConnectedAccount();
  }
  const sortedLocations = locations
    ? [...locations].sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      })
    : [];

  return (
    <>
      {Array.isArray(locations) && locations?.length < 3 ? (
        <NewStoreClient startingStep={1} user={session.user} apiKey={apiKey} />
      ) : (
        <MaxLocations locations={sortedLocations} />
      )}
    </>
  );
}

function MaxLocations({ locations }: { locations: Location[] }) {
  return (
    // Using a wrapper div with responsive scaling classes
    <div className="flex items-center justify-center min-h-screen w-full">
      <div
        className={`${OutfitFont.className} flex flex-col items-center justify-center gap-y-2 md:gap-y-3 w-full max-w-screen-xl mx-auto px-4`}
      >
        <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-center">
          You have reached the maximum of 3 selling locations
        </h2>
        <Link
          className={`border-[1px] font-semibold rounded-xl w-full max-w-xs h-24 md:h-28 lg:h-32 shadow-md flex flex-col items-center justify-center transition-all hover:shadow-lg`}
          href={`/`}
        >
          Go to Home
        </Link>
        <div className="w-full flex flex-col items-center gap-y-2 md:gap-y-3">
          {locations?.map((location, index) => (
            <Link
              key={index}
              className={`border-[1px] rounded-xl w-full max-w-xs h-24 md:h-28 lg:h-32 shadow-md flex flex-col items-center justify-center transition-all hover:shadow-lg`}
              href={`/selling/availability-calendar/${location.id}`}
            >
              <span className="font-semibold">
                {getLocationTitle(location, index)}
              </span>
              {location?.address?.street}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const getLocationTitle = (location: Location, index: number) => {
  if (location?.isDefault) return "Edit Default Location";
  if (index === 1) return "Edit Second Location";
  if (index === 2) return "Edit Third Location";
  return "Edit Other Location";
};
