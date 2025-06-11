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
import {
  calculateAvailabilityScores,
  calculateExpiryDate,
  pluralizeQuantityType,
} from "@/utils/listing-helpers";
import { ListingWithLocAndUser } from "@/types";
import { formatPrice } from "@/utils/listing";
import { FcCheckmark } from "react-icons/fc";
import { HiMiniXMark } from "react-icons/hi2";
import { FiAlertTriangle } from "react-icons/fi";
import { GiPlantsAndAnimals } from "react-icons/gi";

const MarketGrid = ({ children }: { children: any }) => {
  return (
    <div className="w-full px-2 mx-auto max-w-[2560px] z-content bg-slate-100 pb-20 ">
      <div
        className="
        pt-[4.5rem] lg:pt-[5.5rem]
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
  const expiryDate = calculateExpiryDate(listing.createdAt, listing.shelfLife);
  const expiryDateObj = new Date(expiryDate);
  const now = new Date();
  const scores = calculateAvailabilityScores(locHours);
  return (
    <div className={`relative border-2 rounded-xl bg-white`}>
      <div className="flex flex-col relative w-full p-1 z-0">
        <div className="flex flew-row justify-between">
          {" "}
          <Link
            href={`/listings/${listing.id}${params && `?${params}`}`}
            prefetch={true}
            className="block w-full cursor-pointer group mx-auto "
          >
            <h3
              className={`absolute top-2 left-2 pb-[.125rem] z-9999 h-8 w-fit px-2 aspect-square rounded-full flex items-center justify-center transition-none bg-white/90 font-semibold text-sm whitespace-nowrap`}
            >
              {listing.title}
            </h3>
          </Link>
          <div className="pointer-events-none">
            <div className="absolute top-2 right-2 z-9999">
              <ClientBasketButton
                listing={listing}
                user={user}
                isInitiallyInBasket={
                  basketItemIds &&
                  basketItemIds.some((item) => item?.listingId === listing.id)
                }
              />
            </div>
          </div>
        </div>
        <Link
          href={`/listings/${listing.id}${params && `?${params}`}`}
          prefetch={true}
          className="block w-full cursor-pointer group mx-auto !z-0"
        >
          {" "}
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
          </div>{" "}
        </Link>
        <div className={`mt-1 w-full ${OutfitFont.className}`}>
          <div className={`flex flex-row w-full justify-between items-center `}>
            <h2 className={`text-sm font-semibold`}>{listing.location.name}</h2>
            <p className={` text-xs font-semibold text-neutral-500`}>
              {listing.location.address.state}, {listing.location.address.city}
            </p>
          </div>

          <Link
            href={`/listings/${listing.id}${params && `?${params}`}`}
            prefetch={true}
            className="block w-full cursor-pointer group mx-auto !z-0"
          >
            {" "}
            <div className="flex items-center justify-between border-b-2 border-black pb-1  w-full">
              <div className={`text-sm flex flex-col w-full items-start `}>
                <div
                  className={`text-sm flex flex-row w-full justify-between items-center gap-1`}
                >
                  <span className="font-semibold  text-xs">
                    {formatPrice(listing.price)} per{" "}
                    {listing.unit && listing.unit !== "each"
                      ? listing.unit
                      : "item"}
                  </span>
                  <span
                    className={`text-xs ${
                      expiryDateObj < now
                        ? "bg-red-400 w-fit px-1 rounded-sm"
                        : ""
                    } `}
                  >
                    {expiryDateObj < now ? (
                      <div className="flex flex-row justify-center items-center">
                        <FiAlertTriangle className="mr-1" /> Expired:{" "}
                        {expiryDate}
                      </div>
                    ) : (
                      <div>Expires: {expiryDate}</div>
                    )}
                  </span>
                </div>{" "}
                <div
                  className={`text-sm flex flex-row w-full justify-between items-center gap-1`}
                >
                  <h2 className={`text-xs font-normal`}>
                    Stock: {listing.stock}{" "}
                    {pluralizeQuantityType(listing.stock, listing.unit)}
                  </h2>{" "}
                  <h2 className={`text-xs font-normal`}>
                    Minimum order: {listing.minOrder}{" "}
                    {listing.unit !== "each"
                      ? pluralizeQuantityType(listing.minOrder, listing.unit)
                      : "item"}
                  </h2>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-row items-center text-xs">
                <GiPlantsAndAnimals className="mr-1" />
                Organic Rating
              </div>
              <StarRating
                value={listing?.rating?.length - 1}
                size={20}
                color="#000"
              />
            </div>
            <div className="flex flex-col  ">
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
          </Link>
        </div>
      </div>
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
              // Half-filled shows a check with reduced opacity
              <FcCheckmark size={size} color={color} style={{ opacity: 0.5 }} />
            ) : filled ? (
              // Filled shows a check
              <FcCheckmark size={size} color={color} />
            ) : (
              // Empty shows an X
              <HiMiniXMark size={size} color={color} style={{ opacity: 0.3 }} />
            )}
          </span>
        );
      })}
    </div>
  );
};
export { MarketCard, MarketGrid, StarRating };
