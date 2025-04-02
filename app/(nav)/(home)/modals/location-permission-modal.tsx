"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Draggable from "react-draggable";
import { OutfitFont } from "@/components/fonts";

const LocationPermissionPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(1);
  const router = useRouter();

  // Create a properly typed ref for Draggable
  // Use MutableRefObject instead of RefObject to avoid null issues
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const permissionStatus = localStorage.getItem("locationPermissionDenied");
    if (permissionStatus === "true") {
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        localStorage.removeItem("locationPermissionDenied");
      }, 5000);
    }
  }, []);

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: 0 }); // Only update x position

    // Calculate opacity based on x position
    const newOpacity = Math.max(0, 1 - data.x / 200);
    setOpacity(newOpacity);

    // If dragged more than 150px to the right, dismiss the popup
    if (data.x > 150) {
      setShowPopup(false);
      localStorage.removeItem("locationPermissionDenied");
    }
  };

  if (!showPopup) {
    return null;
  }

  return (
    <div className="draggable-wrapper">
      {/* Add type assertion for TypeScript */}
      <Draggable
        nodeRef={nodeRef as any}
        position={position}
        onDrag={handleDrag}
        axis="x"
      >
        <div
          ref={nodeRef}
          style={{ opacity }}
          className={`
            ${OutfitFont.className}
            fixed top-10 left-2 bg-green-100 text-black px-4 py-2 rounded-xl 
            border-[1px] border-slate-500 shadow-md z-50 cursor-move hover:cursor-pointer
            transition-opacity duration-300 ease-in-out
          `}
        >
          <div>Showing all listings regardless of location.</div>
          <Button
            className="text-xs px-2 bg-slate-500 text-black"
            onClick={() =>
              router.push("/info/how-to/user/reenable-location-permission")
            }
          >
            Reenable Location Permission
          </Button>
        </div>
      </Draggable>
    </div>
  );
};

export default LocationPermissionPopup;
