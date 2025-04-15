"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Draggable, { DraggableEvent, DraggableData } from "react-draggable";
import { OutfitFont } from "@/components/fonts";

// Define proper types
type Position = {
  x: number;
  y: number;
};

const LocationPermissionPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(1);
  const router = useRouter();

  // Create a properly typed ref for Draggable
  const nodeRef = useRef<HTMLDivElement>(null);

  // Use useCallback for handlers to prevent unnecessary re-renders
  const handleDismissPopup = useCallback(() => {
    setShowPopup(false);
    localStorage.removeItem("locationPermissionDenied");
  }, []);

  // Handle navigation with useCallback
  const handleNavigateToHelp = useCallback(() => {
    router.push("/info/how-to/user/reenable-location-permission");
  }, [router]);

  // Handle drag with useCallback and proper typing from react-draggable
  const handleDrag = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      setPosition({ x: data.x, y: 0 }); // Only update x position

      // Calculate opacity based on x position
      const newOpacity = Math.max(0, 1 - data.x / 200);
      setOpacity(newOpacity);

      // If dragged more than 150px to the right, dismiss the popup
      if (data.x > 150) {
        handleDismissPopup();
      }
    },
    [handleDismissPopup]
  );

  // Use proper dependency array for useEffect
  useEffect(() => {
    const permissionStatus = localStorage.getItem("locationPermissionDenied");
    if (permissionStatus === "true") {
      setShowPopup(true);

      const timeoutId = setTimeout(() => {
        handleDismissPopup();
      }, 5000);

      // Cleanup function to prevent memory leaks
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [handleDismissPopup]);

  // If not showing popup, return early to reduce nesting
  if (!showPopup) {
    return null;
  }

  // Use classes instead of inline styles where possible
  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <Draggable
        nodeRef={nodeRef as any}
        position={position}
        onDrag={handleDrag}
        axis="x"
      >
        <div
          ref={nodeRef}
          className={`
            ${OutfitFont.className}
            fixed top-10 left-2 bg-green-100 text-black px-4 py-2 rounded-xl 
            border border-slate-500 shadow-md cursor-move hover:cursor-pointer
            transition-opacity duration-300 ease-in-out
          `}
          style={{ opacity }} // Keep only necessary inline style
        >
          <p className="mb-2">Showing all listings regardless of location.</p>
          <Button
            className="text-xs px-2 bg-slate-500 text-black"
            onClick={handleNavigateToHelp}
          >
            Reenable Location Permission
          </Button>
        </div>
      </Draggable>
    </div>
  );
};

export default LocationPermissionPopup;
