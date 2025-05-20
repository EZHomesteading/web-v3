import { OutfitFont } from "@/components/fonts";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarkerInfo } from "../types/map-types";
import { MapPin, Store, ExternalLink } from "lucide-react";
import Cancel from "@/app/(nav)/map/ui/cancel-svg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

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
  if (!selectedMarker) return null;

  // Based on your API response format, extracting images
  const images =
    selectedMarker.listings?.map((listing) => listing.images) || [];

  return (
    <div
      ref={infoWindowRef}
      className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/8 bg-white rounded-xl shadow-lg transition-all duration-300 ease-in-out overflow-hidden z-50"
      style={{ opacity: selectedMarker ? 1 : 0 }}
    >
      {/* Carousel Section */}
      <div className="w-80">
        <Carousel className="w-full">
          <CarouselContent className="rounded-t-md">
            {images.length > 0 ? (
              images.map((image, index) => (
                <CarouselItem key={index} className="w-full">
                  <div className="p-0">
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-md">
                      <Image
                        src={image[0]}
                        alt={`Location image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 320px"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <div className="p-0">
                  <div className="bg-gray-200 aspect-video w-full flex items-center justify-center rounded-t-md">
                    <Store size={48} className="text-gray-400" />
                  </div>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>

          {images.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2" />
              <CarouselNext className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2" />
            </>
          )}

          {/* Close button */}
          <button
            className="absolute top-2 right-2 bg-white rounded-full hover:bg-gray-100 p-1.5 z-10 shadow-sm"
            onClick={handleInfoWindowClose}
          >
            <Cancel />
          </button>
        </Carousel>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Location info */}
        <div className="flex items-center mb-2">
          <MapPin size={16} className="text-blue-600 mr-2 flex-shrink-0" />
          <h1
            className={`${OutfitFont.className} font-semibold text-lg text-gray-800 truncate`}
          >
            {selectedMarker.name}, {selectedMarker.zip}
          </h1>
        </div>

        {/* User info */}
        <div className="flex items-center py-3 border-t border-gray-100">
          <Avatar image={selectedMarker.user.image} />
          <div className="ml-3">
            <h2
              className={`${OutfitFont.className} text-sm font-medium text-gray-800`}
            >
              {selectedMarker.user.firstName || selectedMarker.user.name}
            </h2>
            <div className="flex items-center">
              <Store size={12} className="text-gray-500 mr-1" />
              <p className={`${OutfitFont.className} text-xs text-gray-500`}>
                Store Owner
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex mt-3 gap-2">
          <Link href={`/store/${selectedMarker.user.url}`} className="flex-1">
            <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Store size={16} />
              <span>Visit Store</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarkerInfoWindow;
