//listing page server side layout, getting users and their carts to display toggle cart options.
import { getUnique } from "@/actions/getListings";
import ListingHead from "./components/listing-head";
import { OutfitFont } from "@/components/fonts";
import Link from "next/link";
import { PiAlarm, PiBasketThin } from "react-icons/pi";
import { auth } from "@/auth";
import Avatar from "@/components/Avatar";
import SendMessageComponent from "./components/send-message-component";
import { Viewport } from "next";
import Page404 from "@/app/[...not_found]/page";

import BackButton from "./components/back-button";
import { FcCheckmark } from "react-icons/fc";
import { HiMiniXMark } from "react-icons/hi2";
import HoursDisplay from "./components/hours-display";
import {
  calculateExpiryDate,
  pluralizeQuantityType,
} from "@/utils/listing-helpers";
import { FiAlertTriangle } from "react-icons/fi";

export const viewport: Viewport = {
  themeColor: "#fff",
};

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // function createSearchParamsString(
  //   params: Record<string, string | string[] | undefined> | null | undefined
  // ): string {
  // if (!params) return "";

  // const searchParams = new URLSearchParams();

  // // Iterate over the object and add each valid key-value pair
  // Object.entries(params).forEach(([key, value]) => {
  //   if (value !== undefined) {
  //     if (Array.isArray(value)) {
  //       // Handle array values
  //       value.forEach((val) => {
  //         searchParams.append(key, val);
  //       });
  //     } else if (typeof value === "string") {
  //       // Handle string values
  //       searchParams.append(key, value);
  //     }
  //     // Skip undefined or symbol values
  //   }
  // });
  //
  // return searchParams.toString();
  // }

  // Use the function in your code
  // const marketCallback = searchParams && createSearchParamsString(searchParams)
  const paramss = await params;
  const session = await auth();
  try {
    const listing = await getUnique({ id: paramss.id });
    const ratingMeanings: { [key: number]: string } = {
      1: "Not Genetically Modified",
      2: "No Inorganic Fertilizers",
      3: "No Inorganic Pesticides",
      4: "Not Modified After Harvest",
    };

    const inverseRatingMeanings: { [key: number]: string } = {
      1: "May be Genetically Modified",
      2: "May use Inorganic Fertilizers",
      3: "May use Inorganic Pesticides",
      4: "May be Modified After Harvest",
    };

    if (!listing) {
      return <Page404 />;
    }

    const applicableRatings = listing.rating.filter(
      (index: number) => index !== 0 && index in ratingMeanings
    );

    const possibleRatings = [1, 2, 3, 4];
    const inverseRatings = possibleRatings.filter(
      (index) => index !== 0 && !applicableRatings.includes(index)
    );

    let basketItemIds = [];
    if (session?.user?.id) {
      try {
        const response = await fetch(
          `${process.env.API_URL}/get-many?collection=BasketItem&key=userId&value=${session.user.id}&fields=listingId,id,quantity`
        );

        const data = await response.json();
        basketItemIds = data.items;
      } catch (error) {
        console.error("Error fetching basket items:", error);
      }
    }
    const expiryDate = calculateExpiryDate(
      listing.createdAt,
      listing.shelfLife
    );
    const expiryDateObj = new Date(expiryDate);
    const now = new Date();
    console.log(listing);
    return (
      <>
        <div
          id="modal-root"
          className={`w-full max-w-5xl relative mx-auto ${OutfitFont.className}`}
        >
          <div className={`fixed top-0 w-full max-w-5xl z-10 bg-white`}>
            <div
              className={`h-16  flex justify-between items-center w-full  pr-2 lg:pr-0 pl-1 lg:pl-0`}
            >
              <div className={`flex items-center justify-start space-x-3 `}>
                <BackButton className={""} />
                <div className={` text-3xl font-medium sm:block hidden`}>
                  {listing.title}
                </div>
              </div>
              <Link
                href={`/my-basket`}
                className={`flex  hover:cursor-pointer justify-start items-start space-x-1`}
              >
                <div>
                  <PiBasketThin className="text-2xl" />
                </div>
                <div className={`text-md underline font-normal`}>
                  My Baskets
                </div>
              </Link>
            </div>
          </div>
          <ListingHead listing={listing} />
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 px-2 lg:px-0 mt-2 sm:space-x-2`}
          >
            <div className={`col-span-1 lg:col-span-3 `}>
              <div className={` `}>
                <div
                  className={` text-xl sm:text-3xl block sm:hidden font-medium `}
                >
                  {listing.title}
                </div>
                <div className={`text-sm sm:text-2xl mt-[-5px]`}>
                  {listing.location.address.city},{" "}
                  {listing.location.address.state}
                </div>
                <div
                  className={`flex items-center justify-start space-x-1 text-sm `}
                >
                  <div>
                    {listing.stock}{" "}
                    {listing.unit !== "each"
                      ? pluralizeQuantityType(listing.stock, listing.unit)
                      : "item"}{" "}
                    remaining{" "}
                  </div>

                  <div className={`bg-black h-1 w-1 rounded-full`} />
                  <div>
                    ${listing.price / 100} per{" "}
                    {listing.unit !== "each" ? listing.unit : "item"}
                  </div>
                </div>
                <p
                  className={`text-sm mb-3  ${
                    expiryDateObj < now
                      ? "bg-red-400 w-fit  px-2 rounded-sm"
                      : ""
                  } `}
                >
                  {expiryDateObj < now ? (
                    <div className="flex flex-row justify-center items-center">
                      <FiAlertTriangle className="mr-2" /> Expired: {expiryDate}
                    </div>
                  ) : (
                    <div>Expires: {expiryDate}</div>
                  )}
                </p>
                <Link
                  className={`border-y py-3 flex items-start justify-start gap-x-2  `}
                  href={`/store/${listing.user.url}`}
                >
                  <Avatar
                    image={
                      listing.location?.image ||
                      listing.user.image ||
                      "/images/website-images/placeholder.jpg"
                    }
                    h="12"
                    h2="16"
                  />
                  <div className={`flex flex-col items-start`}>
                    <div className={`text-xl`}>
                      Sold By: {listing.user.name}
                    </div>
                    <div className={`text-xl`}>
                      From: {listing.location.name}
                    </div>
                  </div>
                </Link>
                <div className={`border-b py-3`}>
                  <div className={`text-sm sm:text-xl`}>Item Description</div>
                  {listing.description}{" "}
                </div>
                <ul className="list-none list-inside my-3 space-y-4 border-b pb-3">
                  {applicableRatings.map((ratingIndex: number) => (
                    <li
                      key={ratingIndex}
                      className="text-lg  flex items-center gap-x-1"
                    >
                      <div className={`p-2`}>
                        <FcCheckmark />
                      </div>
                      {ratingMeanings[ratingIndex]}
                    </li>
                  ))}
                  {inverseRatings.map((ratingIndex) => (
                    <li
                      key={ratingIndex}
                      className="text-lg flex items-center gap-x-1"
                    >
                      <div className={`p-2`}>
                        <HiMiniXMark />
                      </div>
                      {inverseRatingMeanings[ratingIndex]}
                    </li>
                  ))}
                </ul>{" "}
                <HoursDisplay
                  location={listing.location}
                  className="mt-4 h-[50%]"
                />
              </div>{" "}
            </div>

            <div className={`col-span-1 lg:col-span-2 relative`}>
              <SendMessageComponent
                basketQuantity={
                  basketItemIds?.find(
                    (basketItem: any) => basketItem.listingId === listing?.id
                  )?.quantity || 0
                }
                listing={listing}
                user={session?.user}
                isInitiallyInBasket={
                  basketItemIds &&
                  basketItemIds.some(
                    (item: any) => item?.listingId === listing?.id
                  )
                }
              />
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error in ListingPage:", error);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Something went wrong!</h1>
          <p className="mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }
}
