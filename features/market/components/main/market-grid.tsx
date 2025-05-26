import { UserInfo } from "next-auth";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../../../components/ui/carousel";
import { OutfitFont } from "@/components/fonts";
import AvailabilityScore from "../../utils/availability-score";
import { Clock } from "lucide-react";
import Link from "next/link";

import ClientBasketButton from "../../utils/market-toggle.client";
import { calculateAvailabilityScores } from "@/utils/avail-score-handlers";
import { ListingWithLocAndUser } from "@/types";
import { formatPrice } from "@/utils/listing";

const MarketGrid = ({ children }: { children: any }) => {
  return (
    <div className="w-full px-2 mx-auto max-w-[2560px] z-content mb-20 ">
      <div
        className="
        pt-[6.5rem]
        grid gap-3
        grid-cols-1
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-4 
        xl:grid-cols-5
        3xl:grid-cols-6"
      >
        {children}
      </div>
    </div>
  );
};
interface MarketCardProps {
  listing: ListingWithLocAndUser;
  user?: UserInfo;
  imageCount: number;
  basketItemIds: any[];
  params?: string;
}

interface TimeSlot {
  open: number;
  close: number;
}

interface DayHours {
  date: string;
  timeSlots: TimeSlot[];
  capacity: number;
}

interface LocationHours {
  [key: string]: DayHours[] | undefined;
  pickup?: DayHours[];
  delivery?: DayHours[];
}

interface ScoreResult {
  pickup: {
    workingmanScore: number;
    retireeScore: number;
    combinedScore: number;
  };
  delivery: {
    workingmanScore: number;
    retireeScore: number;
    combinedScore: number;
  };
}

const MarketCard = ({
  listing,
  imageCount,
  user,
  basketItemIds,
  params,
}: MarketCardProps) => {
  const locHours = listing?.location?.hours;

  const scores = calculateAvailabilityScores(locHours);
  return (
    <div className={`relative border-2 rounded-xl`}>
      <Link
        href={`/listings/${listing.id}${params && `?${params}`}`}
        prefetch={true}
        className="block w-full cursor-pointer group mx-auto !z-0"
      >
        <div className="flex flex-col relative w-full p-1 z-0">
          <div className="relative overflow-hidden rounded-xl w-full z-0 aspect-square">
            <Carousel
              className="h-full w-full relative rounded-lg z-0"
              opts={{
                loop: true,
                align: "start",
              }}
            >
              <CarouselContent className="h-full z-0">
                {listing?.images?.map((src: string, index: number) => (
                  <CarouselItem
                    key={index}
                    className="flex items-center justify-center relative aspect-square h-full"
                  >
                    <Image
                      src={src}
                      alt={`Image ${index + 1} of ${listing?.title}`}
                      loading={imageCount++ < 9 ? "eager" : "lazy"}
                      fill
                      className="object-cover rounded-md hover:scale-105 transition-transform duration-200 !z-0"
                      sizes="(max-width: 540px) 100vw, (max-width: 768px) 50vw, (max-width: 1000px) 33.33vw, (max-width: 1280px) 25vw, 20vw"
                      placeholder="blur"
                      blurDataURL="/images/website-images/grey.jpg"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {listing?.images?.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {listing.images.map((_: string, index: number) => (
                    <div
                      key={index}
                      className="w-2 h-2 rounded-full bg-white opacity-90 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    />
                  ))}
                </div>
              )}
            </Carousel>
          </div>
          <div className={`mt-1 w-full ${OutfitFont.className}`}>
            <h3 className={`font-semibold`}>{listing.title}</h3>
            <h2 className={`text-xs font-normal`}>{listing.location.name}</h2>
            <p className={` text-xs font-light text-neutral-500`}>
              {listing.location.address.state}, {listing.location.address.city}
            </p>

            <div className="flex items-center justify-between mt-2 w-full">
              <div className={`text-sm flex items-center gap-1`}>
                <span className="font-semibold">
                  {formatPrice(listing.price)}
                </span>
                <span className="font-light">
                  per {listing.unit ? listing.unit : "item"}
                </span>
              </div>

              <StarRating
                value={listing?.rating?.length - 1}
                size={20}
                color="#000"
              />
            </div>

            <div className="flex flex-col gap-1 mt-2">
              {listing.location?.hours?.pickup?.length === 0 ? (
                <div className="text-red-500 font-medium flex items-center text-xs">
                  <Clock size={14} className="mr-1" />{" "}
                  <span className="font-medium capitalize">
                    No Pickup Hours
                  </span>
                </div>
              ) : (
                <AvailabilityScore scores={scores} type="pickup" />
              )}
              {listing.location?.hours?.delivery?.length === 0 ? (
                <div className="text-red-500 font-medium flex items-center text-xs">
                  <Clock size={14} className="mr-1" />{" "}
                  <span className="font-medium capitalize">
                    No Delivery Hours
                  </span>
                </div>
              ) : (
                <AvailabilityScore scores={scores} type="delivery" />
              )}
            </div>
          </div>
        </div>
      </Link>
      <ClientBasketButton
        listing={listing}
        user={user}
        isInitiallyInBasket={
          basketItemIds &&
          basketItemIds.some((item) => item?.listingId === listing.id)
        }
      />
    </div>
  );
};
const StarRating = ({
  value,
  size = 20,
  color = "#000",
}: {
  value: number;
  size?: number;
  color?: string;
}) => {
  const totalStars = 4;
  const roundedValue = Math.round(value * 2) / 2;

  return (
    <div className="flex">
      {[...Array(totalStars)].map((_, index) => {
        const filled = index < roundedValue;
        const halfFilled = !filled && index < Math.ceil(roundedValue);

        return (
          <span
            key={index}
            className="inline-block"
            style={{ width: size, height: size }}
          >
            {halfFilled ? (
              <svg
                viewBox="0 0 24 24"
                fill={color}
                style={{ width: size, height: size }}
              >
                <path
                  d="M12 2L8.5 8.5L2 9.3L7 14.1L5.5 20.5L12 17.5L18.5 20.5L17 14.1L22 9.3L15.5 8.5L12 2Z"
                  clipPath="inset(0 50% 0 0)"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill={filled ? color : "none"}
                stroke={color}
                strokeWidth="2"
                style={{ width: size, height: size }}
              >
                <path d="M12 2L8.5 8.5L2 9.3L7 14.1L5.5 20.5L12 17.5L18.5 20.5L17 14.1L22 9.3L15.5 8.5L12 2Z" />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
};
export { MarketCard, MarketGrid, StarRating };
