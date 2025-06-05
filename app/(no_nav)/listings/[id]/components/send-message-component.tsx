"use client";

import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "../../../../../components/ui/drawer";
import useMediaQuery from "@/hooks/media-query";
import SendMessageSection from "./send-messge-section";
import { UserInfo } from "next-auth";
import { OutfitFont } from "@/components/fonts";
import { useBasket } from "@/hooks/listing/use-basket";
import Toast from "@/components/ui/toast";
import Link from "next/link";
import HoursWarningModal from "@/features/market/components/modals/cart-hours-warning";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import NotifyModal from "./notifyModal";

interface SendMessageComponentProps {
  listing: any;
  user?: UserInfo;
  isInitiallyInBasket: boolean;
  basketQuantity: number;
}

const SendMessageComponent = ({
  user,
  listing,
  isInitiallyInBasket,
  basketQuantity,
}: SendMessageComponentProps) => {
  const over_640px = useMediaQuery("(min-width: 640px)");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInBasket, setIsInBasket] = useState(isInitiallyInBasket);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    isLoading,
    toggleBasket,
    showWarning,
    setShowWarning,
    incompatibleDays,
    addToBasket,
    isFirstItemInCart,
  } = useBasket({
    locationId: listing.location.id,
    sellerId: listing.location.userId,
    type: listing.unit,
    stock: listing.stock,
    listingId: listing.id,
    address: listing.location.id,
    user,
    initialQuantity: listing.minOrder || 1,
    hours: listing?.location?.hours,
    onBasketUpdate: (newIsInBasket: boolean) => setIsInBasket(newIsInBasket),
  });

  const handleToggleBasket = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      Toast({
        message: "Please sign in to add items to your basket",
        details: (
          <Link
            href={`/auth/login?callbackUrl=/listings/${listing.id}`}
            className="text-sky-400 underline font-light"
          >
            Sign in here
          </Link>
        ),
      });
      return;
    }

    try {
      await toggleBasket(e, isInBasket, "ACTIVE");
    } catch (error) {
      Toast({ message: "Failed to update basket" });
    }
  };

  return (
    <>
      {" "}
      <NotifyModal
        isOpen={confirmOpen}
        listingId={listing.id}
        onClose={() => setConfirmOpen(false)}
        userEmail={user?.email}
      />
      {over_640px ? (
        <div>
          {listing.stock === 0 ? (
            <div className="border shadow-sm mt-3 rounded-md h-fit pb-6 pt-2 px-2">
              <div className="text-xl font-semibold text-center text-gray-700 mb-3">
                Out of Stock
              </div>
              <div className="text-center text-gray-600 mb-4 text-sm">
                This item is currently unavailable
              </div>
              <Button
                onClick={() => setConfirmOpen(true)}
                className="w-full mt-4 rounded-md p-4 text-lg font-semibold shadow-sm bg-green-400 text-white hover:bg-green-500 transition-colors"
              >
                Notify me when in stock
              </Button>
            </div>
          ) : (
            <SendMessageSection
              basketQuantity={basketQuantity}
              listing={listing}
              user={user}
              onBasketUpdate={(newIsInBasket: boolean) =>
                setIsInBasket(newIsInBasket)
              }
              isInBasket={isInBasket}
            />
          )}
        </div>
      ) : (
        <div>
          {" "}
          {listing.stock === 0 ? (
            <div className="fixed bottom-0 w-screen h-20 bg-white border-t">
              <div className="flex justify-between pr-4 items-center w-full h-full">
                <div className="p-2">Item is out of stock</div>
                <Button
                  onClick={() => setConfirmOpen(true)}
                  className=" bg-green-400 shadow-xl mb-[2px]"
                >
                  Notify me when in stock
                </Button>
              </div>
            </div>
          ) : (
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <div className="fixed bottom-0 w-screen h-20 bg-white border-t">
                <div className="flex justify-between pr-4 items-center w-full h-full">
                  <div className="pl-4">
                    ${listing.price / 100} per {listing.unit}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleToggleBasket}
                      disabled={isLoading}
                      className={`px-4 font-semibold rounded-md py-3 text-sm shadow-sm ${
                        isInBasket
                          ? "bg-red-400 text-white hover:bg-red-500"
                          : "bg-sky-100"
                      }`}
                    >
                      {isInBasket
                        ? "Remove from Basket"
                        : `Add ${listing.minOrder} ${listing.unit} to Basket`}
                    </button>
                    <DrawerTrigger asChild>
                      <button className="px-4 font-semibold rounded-md py-3 text-sm shadow-sm bg-sky-100">
                        Add custom amount to Basket
                      </button>
                    </DrawerTrigger>
                  </div>
                </div>
              </div>
              <DrawerContent
                className={`rounded-t-xl px-2 h-[90vh] ${OutfitFont.className}`}
              >
                <SendMessageSection
                  basketQuantity={basketQuantity}
                  listing={listing}
                  user={user}
                  onBasketUpdate={(newIsInBasket: boolean) =>
                    setIsInBasket(newIsInBasket)
                  }
                  isInBasket={isInBasket}
                />
              </DrawerContent>
            </Drawer>
          )}
        </div>
      )}
      <HoursWarningModal
        isFirstItem={isFirstItemInCart}
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        onConfirm={() => {
          setShowWarning(false);
          addToBasket("ACTIVE");
        }}
        incompatibleDays={incompatibleDays}
        type={listing?.location?.hours?.pickup ? "pickup" : "delivery"}
      />
    </>
  );
};

export default SendMessageComponent;
