import React, { useCallback, useMemo, useEffect } from "react";
import { GoogleMap, MarkerF, MarkerClusterer } from "@react-google-maps/api";
import { LocationInfo, MarkerInfo } from "../types/map-types";

interface GoogleMapComponentProps {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  mapOptions: google.maps.MapOptions;
  handleMouseDown: (event: google.maps.MapMouseEvent) => void;
  handleMouseMove: (event: google.maps.MapMouseEvent) => void;
  handleMouseUp: () => void;
  handleMapClick: (event: google.maps.MapMouseEvent) => void;
  showCoops: boolean;
  showProducers: boolean;
  filteredCoops: LocationInfo[];
  filteredProducers: LocationInfo[];
  handleMarkerClick: (coordinate: number[], id: string) => void;
  selectedMarker: MarkerInfo | null;
}

const GoogleMapComponent = ({
  mapRef,
  mapOptions,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMapClick,
  showCoops,
  showProducers,
  filteredCoops,
  filteredProducers,
  handleMarkerClick,
  selectedMarker,
}: GoogleMapComponentProps) => {
  // Memoize cluster options to prevent unnecessary re-renders
  const coopClusterOptions = useMemo(
    () => ({
      imagePath: "https://i.ibb.co/r42S9tm/circle-2-2.png",
      gridSize: 60, // Reduced from 100 for tighter clustering
      maxZoom: 12,
      minimumClusterSize: 3, // Reduced from 5 to create clusters with fewer markers
    }),
    []
  );

  const producerClusterOptions = useMemo(
    () => ({
      imagePath: "https://i.ibb.co/TMnKw45/circle-2.png",
      gridSize: 60,
      maxZoom: 12,
      minimumClusterSize: 3,
    }),
    []
  );

  // Modified map options - only disable scrolling and zoom when marker is selected
  const combinedMapOptions = useMemo(() => {
    const baseOptions = {
      ...mapOptions,
    };
    //console.log(selectedMarker);
    if (selectedMarker) {
      // Only disable scrolling and zoom, keep other controls
      //console.log(selectedMarker);
      return {
        ...baseOptions,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        gestureHandling: "none", // This prevents pinch-to-zoom and other touch gestures
      };
    }

    return baseOptions;
  }, [mapOptions, selectedMarker]);

  // Apply effective zoom lock when a marker is selected
  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedMarker) {
      // Center on selected marker
      mapRef.current.panTo({
        lat: selectedMarker.coordinates[1],
        lng: selectedMarker.coordinates[0],
      });

      // Store current zoom level
      const currentZoom = mapRef.current.getZoom();

      // Add a single zoom_changed listener that will reset the zoom
      const zoomListener = google.maps.event.addListener(
        mapRef.current,
        "zoom_changed",
        () => {
          if (
            mapRef.current &&
            currentZoom !== undefined &&
            mapRef.current.getZoom() !== currentZoom
          ) {
            mapRef.current.setZoom(currentZoom);
          }
        }
      );

      // Add a listener for center_changed to keep the marker centered
      const centerListener = google.maps.event.addListener(
        mapRef.current,
        "center_changed",
        () => {
          if (mapRef.current) {
            const targetPosition = new google.maps.LatLng(
              selectedMarker.coordinates[1],
              selectedMarker.coordinates[0]
            );
            const currentCenter = mapRef.current.getCenter();

            if (
              currentCenter &&
              (Math.abs(currentCenter.lat() - targetPosition.lat()) > 0.0001 ||
                Math.abs(currentCenter.lng() - targetPosition.lng()) > 0.0001)
            ) {
              mapRef.current.panTo(targetPosition);
            }
          }
        }
      );

      return () => {
        // Clean up listeners when selectedMarker changes or component unmounts
        if (zoomListener) {
          google.maps.event.removeListener(zoomListener);
        }
        if (centerListener) {
          google.maps.event.removeListener(centerListener);
        }
      };
    }
  }, [selectedMarker, mapRef]);

  // Memoize marker rendering to improve performance
  const renderCoopMarkers = useCallback(
    (clusterer: any) => (
      <>
        {filteredCoops.map((coop: LocationInfo, index: number) => (
          <MarkerF
            key={`coop-${index}`}
            position={
              new google.maps.LatLng(coop.coordinates[1], coop.coordinates[0])
            }
            clusterer={clusterer}
            icon={{
              url: "https://ruhn2hhuu8.ufs.sh/f/UE11RVNWlVtTK2DsWbl2sdIpeJnkgZ3A4rjlRzymTaCWL87f",
              scaledSize: new window.google.maps.Size(40, 40),
              size: {
                height: 40,
                width: 40,
                equals: () => true,
              },
              anchor: new window.google.maps.Point(14, 14), // Centered anchor
            }}
            onClick={() => handleMarkerClick(coop.coordinates, coop.id)}
          />
        ))}
      </>
    ),
    [filteredCoops, handleMarkerClick]
  );

  const renderProducerMarkers = useCallback(
    (clusterer: any) => (
      <>
        {filteredProducers.map((producer: LocationInfo, index: number) => (
          <MarkerF
            key={`producer-${index}`}
            position={
              new google.maps.LatLng(
                producer.coordinates[1],
                producer.coordinates[0]
              )
            }
            icon={{
              url: "https://ruhn2hhuu8.ufs.sh/f/UE11RVNWlVtTjGRS8QPNciZUjS7xI6uGEtJ5W9fRX8mH2Qe4",
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(14, 14), // Centered anchor
            }}
            clusterer={clusterer}
            onClick={() => handleMarkerClick(producer.coordinates, producer.id)}
          />
        ))}
      </>
    ),
    [filteredProducers, handleMarkerClick]
  );

  // Conditionally apply event handlers based on whether a marker is selected
  const mapEventHandlers = selectedMarker
    ? {}
    : {
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onClick: handleMapClick,
      };

  return (
    <GoogleMap
      onLoad={(map) => {
        mapRef.current = map;
      }}
      {...mapEventHandlers}
      mapContainerClassName="h-[calc(100vh-64px)] w-screen"
      options={combinedMapOptions}
    >
      {showCoops && (
        <MarkerClusterer options={coopClusterOptions}>
          {(clusterer) => renderCoopMarkers(clusterer)}
        </MarkerClusterer>
      )}

      {showProducers && (
        <MarkerClusterer options={producerClusterOptions}>
          {(clusterer) => renderProducerMarkers(clusterer)}
        </MarkerClusterer>
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
