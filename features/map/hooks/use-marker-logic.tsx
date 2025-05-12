"use client";
import { useState, useEffect, useCallback } from "react";
import { MarkerInfo } from "../types/map-types";

interface UseMarkerLogicProps {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  infoWindowRef: React.MutableRefObject<HTMLDivElement | null>;
  setCurrentCenter: (center: number[]) => void;
  setZoom: (zoom: number) => void;
}

export const useMarkerLogic = ({
  mapRef,
  infoWindowRef,
  setCurrentCenter,
  setZoom,
}: UseMarkerLogicProps) => {
  const [selectedMarker, setSelectedMarker] = useState<MarkerInfo | null>(null);
  const [previousCenter, setPreviousCenter] = useState<number[] | null>(null);
  const [previousZoom, setPreviousZoom] = useState<number | null>(null);

  const handleMarkerClick = useCallback(
    async (coordinate: number[], id: string) => {
      try {
        const response = await fetch(`/api/useractions/marker-info?id=${id}`);
        const markerData = await response.json();

        // Store the current center before changing
        if (mapRef.current) {
          const currentCenter = mapRef.current.getCenter();
          if (currentCenter) {
            setPreviousCenter([currentCenter.lng(), currentCenter.lat()]);
          }
        }

        setSelectedMarker({
          name: markerData.name,
          coordinates: coordinate,
          listings: {
            images: markerData.listings.images,
          },
          user: {
            name: markerData.user.name,
            firstName: markerData.user.firstName,
            url: markerData.user.url,
            image: markerData.user.image,
          },
        });
        setCurrentCenter(coordinate);
        setZoom(13);
      } catch (error) {
        console.error("Error fetching marker info:", error);
      }
    },
    [setCurrentCenter, setZoom, mapRef]
  );

  const handleInfoWindowClose = useCallback(() => {
    // Restore to previous center and zoom if available
    if (previousCenter && mapRef.current) {
      setCurrentCenter(previousCenter);
      setPreviousCenter(null);
    }

    if (previousZoom && mapRef.current) {
      setZoom(previousZoom);
      setPreviousZoom(null);
    }

    setSelectedMarker(null);
  }, [previousCenter, previousZoom, setCurrentCenter, setZoom, mapRef]);

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (
        infoWindowRef.current &&
        !infoWindowRef.current.contains(event.domEvent.target as Node)
      ) {
        handleInfoWindowClose();
      }
    },
    [infoWindowRef, handleInfoWindowClose]
  );

  useEffect(() => {
    if (selectedMarker && mapRef.current) {
      const map = mapRef.current;
      const markerPosition = new google.maps.LatLng(
        selectedMarker.coordinates[1],
        selectedMarker.coordinates[0]
      );
      map.panTo(markerPosition);
    }
  }, [selectedMarker, mapRef]);

  return {
    selectedMarker,
    handleMarkerClick,
    handleInfoWindowClose,
    handleMapClick,
  };
};
