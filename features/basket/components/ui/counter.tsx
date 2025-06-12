"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { BasketItem, useBasket } from "../main/detailed-basket-grid";

interface QuantityProps {
  item: BasketItem;
  basketId: string;
}

const SpCounter = ({ item, basketId }: QuantityProps) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputDisplayValue, setInputDisplayValue] = useState(
    item.quantity.toString()
  );
  const pendingQuantityRef = useRef<number | null>(null);

  // Only update local quantity from props when input is not focused
  useEffect(() => {
    if (!isInputFocused && item.quantity !== localQuantity) {
      setLocalQuantity(item.quantity);
      setInputDisplayValue(item.quantity.toString());
    }
  }, [item.quantity, isInputFocused, localQuantity]);

  const updateServer = useCallback(
    debounce(async (newQuantity: number) => {
      try {
        await axios.post(`/api/baskets/update`, {
          id: basketId,
          items: [{ listingId: item.listing.id, quantity: newQuantity }],
        });
      } catch (error) {
        console.error("Error updating basket:", error);
      }
    }, 500), // Reduced debounce time since we're controlling when it fires
    [basketId, item.listing.id]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputDisplayValue(value);

    // Only update quantity if it's a valid number
    const val = Number(value);
    if (!isNaN(val) && value !== "") {
      const stock = item.listing.stock ?? Infinity;
      const minOrder = item.listing.minOrder ?? 1;
      const clampedQuantity = Math.min(Math.max(val, minOrder), stock);

      setLocalQuantity(clampedQuantity);
      pendingQuantityRef.current = clampedQuantity;
    }
  };

  const handleQuantityChange = (newValue: number) => {
    if (newValue === localQuantity) return;
    const stock = item.listing.stock ?? Infinity;
    const minOrder = item.listing.minOrder ?? 1;
    const clampedQuantity = Math.min(Math.max(newValue, minOrder), stock);

    setLocalQuantity(clampedQuantity);
    setInputDisplayValue(clampedQuantity.toString());

    // Don't mutate the item directly while typing
    if (!isInputFocused) {
      item.quantity = clampedQuantity;
    }

    // If input is focused, store the pending quantity instead of updating immediately
    if (isInputFocused) {
      pendingQuantityRef.current = clampedQuantity;
    } else {
      updateServer(clampedQuantity);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);

    // If input is empty or invalid, reset to minimum order
    if (
      inputDisplayValue === "" ||
      isNaN(Number(inputDisplayValue)) ||
      inputDisplayValue < item.listing.minOrder
    ) {
      const minOrder = item.listing.minOrder ?? 1;
      setLocalQuantity(minOrder);
      setInputDisplayValue(minOrder.toString());
      item.quantity = minOrder;
      updateServer(minOrder);
      return;
    }

    // Update the item quantity when losing focus
    if (pendingQuantityRef.current !== null) {
      item.quantity = pendingQuantityRef.current;
      updateServer(pendingQuantityRef.current);
      pendingQuantityRef.current = null;
    } else {
      // Ensure item quantity matches local quantity
      item.quantity = localQuantity;
    }
  };

  return (
    <div>
      <div className="text-xs">
        Total Price: ${(localQuantity * item.price) / 100}
      </div>
      <div className="flex flex-row gap-x-2 min-w-fit border-[1px] items-center border-gray-500 shadow-md rounded-lg w-fit px-1 sm:mt-2">
        <button
          type="button"
          className="p-2 touch-manipulation"
          onClick={() => handleQuantityChange(localQuantity - 1)}
        >
          -
        </button>
        <input
          value={inputDisplayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="max-w-[40px] text-center"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <button
          type="button"
          className="p-2 touch-manipulation"
          onClick={() => handleQuantityChange(localQuantity + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default SpCounter;
