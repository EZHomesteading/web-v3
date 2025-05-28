"use client";
import { useBasket } from "@/hooks/listing/use-basket";
import Toast from "../../../components/ui/toast";
import Link from "next/link";
import { PiBasketThin, PiPlus } from "react-icons/pi";
import HoursWarningModal from "../components/modals/cart-hours-warning";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface DateCompatibility {
  date: string;
  compatible: boolean;
  overlapHours: number;
}

interface CartToggleProps {
  listing: any;
  user: User | null | undefined;
  onCartUpdate?: (inCart: boolean, quantity: number) => void;
  isInBasket: boolean;
  onBasketUpdate: (newState: boolean) => void;
}

const MarketCartToggle = ({
  user,
  listing,
  isInBasket,
  onBasketUpdate,
}: CartToggleProps) => {
  const {
    isLoading,
    toggleBasket,
    showWarning,
    setShowWarning,
    incompatibleDays,
    addToBasket,
    isFirstItemInCart,
  } = useBasket({
    stock: listing.stock,
    listingId: listing?.id,
    address: listing.location.id,
    user,
    initialQuantity: listing?.minOrder || 1,
    hours: listing?.location?.hours,
    onBasketUpdate: onBasketUpdate,
  });
  const handleConfirmAddToBasket = async () => {
    await addToBasket("ACTIVE"); // or pass correct status if needed
    setShowWarning(false);
    onBasketUpdate(true);
  };
  const handleToggleBasket = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      Toast({
        message: "Please sign in to add items to your basket",
        details: (
          <Link
            href={`/auth/login?callbackUrl=/listings/${listing?.id}`}
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
      <button
        disabled={isLoading}
        onClick={handleToggleBasket}
        className={`w-14 h-8 aspect-square rounded-full border flex items-center justify-center
    ${isInBasket ? "bg-red-400 hover:bg-red-500" : "bg-black/30"}
    relative pointer-events-auto`}
      >
        {" "}
        <PiPlus
          className="text-white"
          size={20}
          style={{
            filter: "drop-shadow(10px 10px 5px black)",
            strokeWidth: 1.5,
          }}
        />
        <PiBasketThin
          className="text-white"
          size={20}
          style={{
            filter: "drop-shadow(10px 10px 5px black)",
            strokeWidth: 1.5,
          }}
        />
      </button>

      {/* Only render modal when showWarning is true for better state management */}
      {showWarning && (
        <HoursWarningModal
          isOpen={showWarning}
          onClose={() => setShowWarning(false)}
          onConfirm={handleConfirmAddToBasket}
          incompatibleDays={incompatibleDays}
          type={
            listing?.location?.hours?.pickup?.length > 0 ? "pickup" : "delivery"
          }
          isFirstItem={isFirstItemInCart} // Pass the isFirstItem flag from useBasket
        />
      )}
    </>
  );
};

export default MarketCartToggle;
