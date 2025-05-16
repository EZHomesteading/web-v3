//map routes server side page layout

import { getNavUser, getVendorLocsMap, NavUser } from "@/actions/getUser";
import Map from "@/app/(nav)/map/map";
import ClientOnly from "@/components/client/client-only";
import { coordObj } from "@/types";
import { UserRole } from "@prisma/client";
import type { Viewport } from "next";
//import MapPopup from "@/app/(nav)/info-modals/map-info-modal";

export const viewport: Viewport = {
  themeColor: "white",
};
const MapPage = async () => {
  const map_api_key = process.env.MAPS_KEY as string;
  const user = await getNavUser();

  let producers: any = [];

  let coops = await getVendorLocsMap({ role: UserRole.COOP });
  // Fetch producers only if the user has a role of PRODUCER or COOP
  if (user?.role === UserRole.PRODUCER || user?.role === UserRole.COOP) {
    producers = await getVendorLocsMap({ role: UserRole.PRODUCER });
  }

  const defaultLocation = { lat: 39.5, lng: -98.35 };
  const initialLocation =
    user?.locations && user.locations[0]
      ? {
          lat: user?.locations[0].coordinates[1],
          lng: user?.locations[0].coordinates[0],
        }
      : defaultLocation;

  return (
    <div className="h-sreen overflow-hidden w-full touch-none">
      <div className="h-[calc(100vh-64px)] overflow-hidden w-full touch-none">
        <ClientOnly>
          <Map
            coordinates={initialLocation}
            coops={coops}
            producers={producers}
            mk={map_api_key}
            user={user}
          />
        </ClientOnly>
      </div>
      {/* <MapPopup /> */}
    </div>
  );
};

export default MapPage;
