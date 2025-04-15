import { OutfitFont } from "@/components/fonts";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import InfoWindowCarousel from "@/app/(nav)/map/info-window-carousel";
import { MarkerInfo } from "../types/map-types";

interface MarkerInfoWindowProps {
  infoWindowRef: React.RefObject<HTMLDivElement | null>;
  selectedMarker: MarkerInfo;
  handleInfoWindowClose: () => void;
}

const MarkerInfoWindow = ({
  infoWindowRef,
  selectedMarker,
  handleInfoWindowClose,
}: MarkerInfoWindowProps) => {
  return (
    <div
      ref={infoWindowRef}
      className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 bg-white rounded-lg shadow-md transition-opacity duration-500 ease-in-out p-0 m-0"
      style={{ opacity: selectedMarker ? 1 : 0 }}
    >
      <div className="flex items-start flex-col bg-slate-200 rounded-lg">
        <InfoWindowCarousel
          handleInfoWindowClose={handleInfoWindowClose}
          images={selectedMarker.listings.images}
        />
        <header className="flex flex-row p-1 relative w-full">
          <Avatar image={selectedMarker.user.image} />
          <ul className="flex flex-col ml-1 pl-1">
            <h1 className={`${OutfitFont.className} text-sm`}>
              {selectedMarker.user.name}
            </h1>
            <p className={`${OutfitFont.className} text-xs text-gray-600`}>
              {selectedMarker.user.firstName}
            </p>
          </ul>
          <Link
            href={`/store/${selectedMarker.user.url}`}
            className="absolute right-1 top-1"
          >
            <Button>Go to Store</Button>
          </Link>
        </header>
      </div>
    </div>
  );
};

export default MarkerInfoWindow;
