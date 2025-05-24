// app/(nav)/map/hooks/use-map-logic.ts
import { useState, useEffect } from "react";

interface UseMapLogicProps {
  initialCoordinates: { lat: number; lng: number };
  mapRef: React.MutableRefObject<google.maps.Map | null>;
}

export const useMapLogic = ({
  initialCoordinates,
  mapRef,
}: UseMapLogicProps) => {
  // Change the state to use [lng, lat] format to match your marker logic
  const [currentCenter, setCurrentCenter] = useState<number[]>([
    initialCoordinates.lng,
    initialCoordinates.lat,
  ]);

  const [zoom, setZoom] = useState(
    initialCoordinates.lat === 39.5 && initialCoordinates.lng === -98.35
      ? 5
      : 10
  );

  // Convert currentCenter back to { lat, lng } format for Google Maps
  const mapCenter = {
    lng: currentCenter[0],
    lat: currentCenter[1],
  };

  const mapOptions: google.maps.MapOptions = {
    center: mapCenter,
    zoom: zoom,
    mapId: "86bd900426b98c0a",
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    keyboardShortcuts: false,
    clickableIcons: false,
    disableDefaultUI: true,
    maxZoom: 12,
    scrollwheel: true,
    minZoom: 4,
    gestureHandling: "greedy",
  };

  useEffect(() => {
    // Disable default touch behavior
    const disableDefaultTouchBehavior = (event: TouchEvent) => {
      event.preventDefault();
    };

    window.addEventListener("touchmove", disableDefaultTouchBehavior, {
      passive: false,
    });

    return () => {
      // Cleanup function to remove event listener
      window.removeEventListener("touchmove", disableDefaultTouchBehavior);
    };
  }, []);

  const handleCenterChanged = () => {
    if (mapRef.current) {
      const newCenter = mapRef.current.getCenter();
      if (newCenter) {
        // Use [lng, lat] format for currentCenter
        setCurrentCenter([newCenter.lng(), newCenter.lat()]);
      }
    }
  };

  const handleZoomChanged = () => {
    if (mapRef.current) {
      const newZoom = mapRef.current.getZoom();
      if (newZoom !== undefined) {
        setZoom(newZoom);
      }
    }
  };

  return {
    currentCenter,
    setCurrentCenter,
    zoom,
    setZoom,
    mapOptions,
    handleCenterChanged,
    handleZoomChanged,
  };
};
