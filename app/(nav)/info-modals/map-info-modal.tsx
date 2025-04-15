"use client";

import { Outfit } from "next/font/google";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Draggable, { DraggableEvent, DraggableData } from "react-draggable";
import { useRouter } from "next/navigation";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

const MapPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(1);
  const nodeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Use proper dependencies in useEffect
  useEffect(() => {
    const hasVisitedMapPage = localStorage.getItem("hasVisitedMapPage");
    if (!hasVisitedMapPage) {
      setShowPopup(true);
      localStorage.setItem("hasVisitedMapPage", "true");
    }

    // Cleanup function to prevent memory leaks
    return () => {
      // No cleanup needed but added for best practice
    };
  }, []);

  // Memoize handlers with useCallback
  const handleContinue = useCallback(() => {
    setShowPopup(false);
    localStorage.removeItem("hasVisitedDashboard");
    router.push("/dashboard");
  }, [router]);

  // Fixed type definition to match what react-draggable expects
  const handleDrag = useCallback((e: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: 0 });
    const newOpacity = Math.max(0, 1 - data.x / 200);
    setOpacity(newOpacity);

    if (data.x > 150) {
      setShowPopup(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    setShowPopup(false);
  }, []);

  // Return early if popup shouldn't show
  if (!showPopup) {
    return null;
  }

  // Extract styles to improve readability and performance
  const popupStyles = {
    opacity: opacity,
  };

  // Using CSS classes instead of inline styles where possible
  return (
    <Draggable
      nodeRef={nodeRef as any}
      position={position}
      onDrag={handleDrag}
      axis="x"
    >
      <div
        ref={nodeRef}
        style={popupStyles}
        className={`
          ${outfit.className}
          fixed top-20 left-2 bg-white text-black px-6 py-4 rounded-xl 
          border border-slate-300 shadow-lg z-50 cursor-move
          transition-opacity duration-300 ease-in-out max-w-md
        `}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Welcome to the EZH Map</h2>

          <p>Here's how it works:</p>

          <ul className="list-disc pl-5 space-y-1">
            <li>Blue markers are Co-ops & green markers are producers</li>
            <li>
              Click on a marker to see their rating, items in stock, and to go
              to their store
            </li>
            <li>
              Click start drawing to free-hand outline an area, vendors not
              inside your shape will be hidden
            </li>
          </ul>

          <div className="grid grid-cols-2 gap-4">
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleContinue}
            >
              Restart Walkthrough
            </Button>
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleClose}
            >
              I've Got It!
            </Button>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default MapPopup;
