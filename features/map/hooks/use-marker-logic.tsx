import { useState, useEffect, useCallback } from "react";

interface MarkerInfo {
  coordinates: number[];
  listings: {
    images: string[];
  };
  user: {
    name: string;
    firstName: string;
    url: string;
    image: string;
  };
}

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

  const handleMarkerClick = useCallback(
    async (coordinate: number[], id: string) => {
      try {
        const response = await fetch(
          `/api/useractions/user/marker-info?id=${id}`
        );
        const markerData = await response.json();
        setSelectedMarker({
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
    [setCurrentCenter, setZoom]
  );

  const handleInfoWindowClose = useCallback(() => {
    setSelectedMarker(null);
  }, []);

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
