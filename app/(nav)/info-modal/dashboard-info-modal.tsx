"use client";

import { Outfit } from "next/font/google";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Draggable from "react-draggable";
import { useRouter } from "next/navigation";
import type { DraggableData, DraggableEvent } from "react-draggable";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

// Define styles outside the component to reduce JSX nesting
const popupContainerStyles = {
  popupBase: `${outfit.className} fixed top-20 left-2 bg-white text-black px-6 py-4 rounded-xl 
    border-[1px] border-slate-300 shadow-lg z-50 cursor-move
    transition-opacity duration-300 ease-in-out max-w-md`,
  closeButton: "absolute top-2 right-2 text-gray-500 hover:text-gray-700",
  heading: "text-2xl font-bold mb-4",
  paragraph: "mb-4",
  list: "list-disc list-inside mb-4",
  continueButton: "bg-blue-500 text-white hover:bg-blue-600",
};

const DashboardPopup = () => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [opacity, setOpacity] = useState<number>(1);
  const nodeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check if user has visited dashboard before
  useEffect(() => {
    const hasVisitedDashboard = localStorage.getItem("hasVisitedDashboard");
    if (!hasVisitedDashboard) {
      setShowPopup(true);
      localStorage.setItem("hasVisitedDashboard", "true");
    }

    // Cleanup function to prevent memory leaks
    return () => {
      // Cleanup any subscriptions or timers if needed
    };
  }, []);

  // Handle drag with proper typing and memoization
  const handleDrag = useCallback((e: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: 0 });
    const newOpacity = Math.max(0, 1 - data.x / 200);
    setOpacity(newOpacity);

    if (data.x > 150) {
      setShowPopup(false);
    }
  }, []);

  // Memoize handlers to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    setShowPopup(false);
  }, []);

  const handleContinue = useCallback(() => {
    setShowPopup(false);
    localStorage.removeItem("hasVisitedMessagePage");
    router.push("/chat");
  }, [router]);

  // Early return if popup shouldn't be shown
  if (!showPopup) {
    return null;
  }

  // Create style object with computed opacity
  const dynamicStyle = useMemo(() => ({ opacity }), [opacity]);

  return (
    <Draggable
      nodeRef={nodeRef as any}
      position={position}
      onDrag={handleDrag}
      axis="x"
    >
      <div
        ref={nodeRef}
        style={dynamicStyle}
        className={popupContainerStyles.popupBase}
      >
        <button
          onClick={handleClose}
          className={popupContainerStyles.closeButton}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className={popupContainerStyles.heading}>
          Welcome to Your Dashboard!
        </h2>

        <p className={popupContainerStyles.paragraph}>
          Here's a quick overview of what you can do:
        </p>

        <ul className={popupContainerStyles.list}>
          <li>View your total sales and incoming payouts</li>
          <li>Check your ongoing buy and sell orders</li>
          <li>See your follower count</li>
          <li>View recent purchases and sales</li>
          <li>View your sale history</li>
          <li>And much more!</li>
        </ul>

        <Button
          className={popupContainerStyles.continueButton}
          onClick={handleContinue}
        >
          Continue Walkthrough
        </Button>
      </div>
    </Draggable>
  );
};

export default DashboardPopup;
