"use client";
import React, { createContext, useState, useMemo, useCallback } from "react";

interface BasketContextType {
  basketTotals: {
    total: number;
    itemCount: number;
  };
  updateBasketTotals: (totals: { total: number; itemCount: number }) => void;
}

// Provide a default value to the context
export const BasketContext = createContext<BasketContextType>({
  basketTotals: { total: 0, itemCount: 0 },
  updateBasketTotals: () => {},
});

export const BasketProvider = ({ children }: { children: React.ReactNode }) => {
  const [basketTotals, setBasketTotals] = useState({ total: 0, itemCount: 0 });

  const updateBasketTotals = useCallback(
    (newTotals: { total: number; itemCount: number }) => {
      setBasketTotals((prev) => {
        if (
          prev.total === newTotals.total &&
          prev.itemCount === newTotals.itemCount
        ) {
          return prev;
        }
        return newTotals;
      });
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      basketTotals,
      updateBasketTotals,
    }),
    [basketTotals, updateBasketTotals]
  );

  return (
    <BasketContext.Provider value={contextValue}>
      {children}
    </BasketContext.Provider>
  );
};

// Create a custom hook to use the context
export const useBasket = () => {
  const context = React.useContext(BasketContext);
  if (context === undefined) {
    throw new Error("useBasket must be used within a BasketProvider");
  }
  return context;
};
