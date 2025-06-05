"use client";
import { useBasket } from "@/hooks/listing/use-basket";
import Toast from "../../../components/ui/toast";
import Link from "next/link";
import {
  PiBasketThin,
  PiPlus,
  PiMinus,
  PiCheck,
  PiX,
  PiTrash,
} from "react-icons/pi";
import HoursWarningModal from "../components/modals/cart-hours-warning";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantity, setQuantity] = useState(listing?.minOrder || 1);
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    if (showQuantityModal) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowQuantityModal(false);
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [showQuantityModal]);

  const {
    isLoading,
    toggleBasket,
    showWarning,
    setShowWarning,
    incompatibleDays,
    addToBasket,
    isFirstItemInCart,
    updateQuantity,
  } = useBasket({
    locationId: listing.location.id,
    sellerId: listing.location.userId,
    type: listing.unit,
    stock: listing.stock,
    listingId: listing?.id,
    address: listing.location.id,
    user,
    initialQuantity: quantity,
    hours: listing?.location?.hours,
    onBasketUpdate: onBasketUpdate,
  });

  const handleConfirmAddToBasket = async () => {
    await addToBasket("ACTIVE");
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

    // If removing from basket, just toggle
    if (isInBasket) {
      try {
        await toggleBasket(e, isInBasket, "ACTIVE");
      } catch (error) {
        Toast({ message: "Failed to update basket" });
      }
      return;
    }

    // If adding to basket, show quantity modal
    setShowQuantityModal(true);
  };

  const handleQuantityChange = (newQuantity: number) => {
    const clampedQuantity = Math.max(
      listing?.minOrder || 1,
      Math.min(newQuantity, listing.stock)
    );
    setQuantity(clampedQuantity);
    updateQuantity(clampedQuantity);
  };

  const handleConfirmQuantity = async () => {
    if (quantity < (listing?.minOrder || 1)) {
      Toast({
        message: `Quantity must be ${listing?.minOrder || 1} ${
          listing.unit
        } or more`,
      });
      return;
    }

    try {
      await toggleBasket(
        { preventDefault: () => {}, stopPropagation: () => {} } as any,
        false,
        "ACTIVE",
        quantity
      );
      setShowQuantityModal(false);
    } catch (error) {
      Toast({ message: "Failed to add to basket" });
    }
  };
  const renderModal = () => {
    if (!mounted || !showQuantityModal) return null;

    return createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{
          zIndex: 2147483647, // Maximum z-index value
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.target === e.currentTarget) {
            setShowQuantityModal(false);
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 max-h-[90vh] flex flex-col"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex justify-between items-start p-6 pb-0 flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Add to Basket
              </h3>
              <p className="text-sm text-gray-600">{listing.title}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuantityModal(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <PiX size={24} />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {/* Price Info */}
            <div className="text-center mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                ${listing.price / 100}
              </div>
              <div className="text-sm text-gray-600">per {listing.unit}</div>
            </div>

            {/* Quantity Controls */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuantityChange(quantity - 1);
                  }}
                  disabled={quantity <= (listing?.minOrder || 1)}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PiMinus size={20} />
                </button>

                <div className="flex flex-col items-center min-w-[80px]">
                  <span className="text-3xl font-bold text-gray-900">
                    {quantity}
                  </span>
                  <span className="text-sm text-gray-500">{listing.unit}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuantityChange(quantity + 1);
                  }}
                  disabled={quantity >= listing.stock}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PiPlus size={20} />
                </button>
              </div>
            </div>

            {/* Stock & Min Order Info */}
            <div className="mb-6 space-y-1 text-xs text-gray-500 text-center">
              <div>
                Stock available: {listing.stock} {listing.unit}
              </div>
              {listing?.minOrder && listing.minOrder > 1 && (
                <div>
                  Minimum order: {listing.minOrder} {listing.unit}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mb-6 p-3 bg-sky-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total:</span>
                <span className="text-xl font-bold text-sky-600">
                  ${((listing.price / 100) * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-500 text-center mb-4">
              You will not be charged at this time
            </p>
          </div>

          {/* Footer - Fixed */}
          <div className="flex space-x-3 p-6 pt-0 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuantityModal(false);
              }}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConfirmQuantity();
              }}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <PiCheck size={18} />
              Add to Basket
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };
  return (
    <>
      <button
        disabled={isLoading}
        onClick={handleToggleBasket}
        className={`w-14 h-8 aspect-square rounded-full border flex items-center justify-center transition-all duration-200
          ${
            isInBasket
              ? "bg-red-400 hover:bg-red-500"
              : "bg-black/30 hover:bg-black/40"
          }
          relative pointer-events-auto`}
      >
        {isInBasket ? (
          <PiTrash
            className="text-white"
            size={20}
            style={{
              filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.3))",
              strokeWidth: 1.5,
            }}
          />
        ) : (
          <>
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
          </>
        )}
      </button>

      {/* Quantity Selection Modal - Rendered via Portal */}
      {renderModal()}

      {/* Hours Warning Modal */}
      {showWarning && (
        <HoursWarningModal
          isOpen={showWarning}
          onClose={() => setShowWarning(false)}
          onConfirm={handleConfirmAddToBasket}
          incompatibleDays={incompatibleDays}
          type={
            listing?.location?.hours?.pickup?.length > 0 ? "pickup" : "delivery"
          }
          isFirstItem={isFirstItemInCart}
        />
      )}
    </>
  );
};

export default MarketCartToggle;
