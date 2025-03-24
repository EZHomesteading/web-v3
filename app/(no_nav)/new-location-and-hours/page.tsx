//onboarding parent element
import { Viewport } from "next";
import authCache from "@/auth-cache";
import Link from "next/link";
import { OutfitFont } from "@/components/fonts";
import { getUserLocations } from "@/actions/getLocations";
import NewLocHourClientV2 from "./components/v2.client";
import { Location } from "@/types";

export const viewport: Viewport = {
  themeColor: "#fff",
};

const apiKey = process.env.MAPS_KEY!;

export default async function Page() {
  const session = await authCache();
  if (!session?.user.id) {
    return;
  }
  const locations = await getUserLocations({
    userId: session?.user.id,
  });

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
        <NewLocHourClientV2 user={session.user} apiKey={apiKey} />
      ) : (
        <MaxLocations locations={sortedLocations} />
      )}
    </>
  );
}

function MaxLocations({ locations }: { locations: Location[] }) {
  return (
    <div
      className={`${OutfitFont.className} flex flex-col items-center justify-center h-screen gap-y-2`}
    >
      You have reached the maximum of 3 selling locations
      <Link
        className={` border-[1px] font-semibold rounded-xl w-[300px] h-[100px] shadow-md flex flex-col items-center justify-center`}
        href={`/`}
      >
        Go to Home
      </Link>
      {locations?.map((location, index) => (
        <Link
          key={index}
          className={` border-[1px] rounded-xl w-[300px] h-[100px] shadow-md flex flex-col items-center justify-center`}
          href={`/selling/availability-calendar/${location.id}`}
        >
          <span className="font-semibold">
            {getLocationTitle(location, index)}
          </span>
          {location?.address?.street}
        </Link>
      ))}
    </div>
  );
}

const getLocationTitle = (location: Location, index: number) => {
  if (location?.isDefault) return "Edit Default Location";
  if (index === 1) return "Edit Second Location";
  if (index === 2) return "Edit Third Location";
  return "Edit Other Location";
};
