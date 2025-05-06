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
  // Change the state type to use number[] format for center
  const [currentCenter, setCurrentCenter] = useState<number[]>([
    initialCoordinates.lat,
    initialCoordinates.lng,
  ]);
  const [zoom, setZoom] = useState(11);

  // Convert currentCenter back to { lat, lng } format for Google Maps
  const mapCenter = {
    lat: currentCenter[0],
    lng: currentCenter[1],
  };

  const mapOptions: google.maps.MapOptions = {
    center: mapCenter, // Use the converted format
    zoom: zoom,
    mapId: "86bd900426b98c0a",
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    keyboardShortcuts: false,
    clickableIcons: true,
    disableDefaultUI: true,
    maxZoom: 13,
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
        // Use number[] format for currentCenter
        setCurrentCenter([newCenter.lat(), newCenter.lng()]);
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
