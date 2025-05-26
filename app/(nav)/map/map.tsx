"use client";

import { useRef } from "react";
import { UserRole } from "@prisma/client";
import { Libraries } from "@googlemaps/js-api-loader";
import { useLoadScript } from "@react-google-maps/api";
import Loading from "@/components/secondary-loader";
import { NavUser } from "@/actions/getUser";
import MapHeader from "@/features/map/components/map-header";
import DrawingControls from "@/features/map/components/drawing-controls";
import GoogleMapComponent from "@/features/map/components/google-map-component";
import MarkerInfoWindow from "@/features/map/components/marker-info-window";
import { OutfitFont } from "@/components/fonts";
import { useMapLogic } from "@/features/map/hooks/use-map-logic";
import { useDrawingLogic } from "@/features/map/hooks/use-drawing-logic";
import { useMarkerLogic } from "@/features/map/hooks/use-marker-logic";
import { MapUser } from "@/features/map/types/map-types";
import SVGComponent from "@/public/icons/barn";

interface MapProps {
  coops: MapUser[];
  producers: MapUser[];
  coordinates: { lat: number; lng: number };
  mk: string;
  user?: NavUser | null;
}

const libraries: Libraries = ["drawing", "geometry"];

const VendorsMap = ({ coops, producers, coordinates, mk, user }: MapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<HTMLDivElement | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: mk,
    libraries,
    version: "3.55",
  });

  // Convert data to proper format
  const coopInfo = coops.map((coop: MapUser) => ({
    coordinates: coop.coordinates,
    id: coop.id,
  }));

  const producerInfo = producers.map((producer: MapUser) => ({
    coordinates: producer.coordinates,
    id: producer.id,
  }));

  // Use custom hooks for logic separation
  const storedState = sessionStorage.getItem("searchLocationState");
  let coordinatesSes = { lat: "", lng: "" };

  if (storedState && JSON.parse(storedState) !== "") {
    const { addressSet, coordinates, searchQuerySet } = JSON.parse(storedState);
    coordinatesSes = coordinates;
  }
  if (
    coordinatesSes !== null &&
    coordinatesSes.lat !== "" &&
    coordinatesSes.lng !== "" &&
    coordinates.lat === 39.5
  ) {
    coordinates = {
      lat: parseFloat(coordinatesSes.lat),
      lng: parseFloat(coordinatesSes.lng),
    };
  }

  const {
    currentCenter,
    setCurrentCenter,
    zoom,
    setZoom,
    handleCenterChanged,
    handleZoomChanged,
    mapOptions,
  } = useMapLogic({
    initialCoordinates: coordinates,
    mapRef,
  });

  const {
    showCoops,
    setShowCoops,
    showProducers,
    setShowProducers,
    filteredCoops,
    filteredProducers,
    drawnShape,
    isDrawingEnabled,
    isDrawing,
    isApplyButtonVisible,
    polylinePath,
    polylineRef,
    startDrawing,
    stopDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    applyDrawnShape,
    resetMap,
  } = useDrawingLogic({
    coopInfo,
    producerInfo,
    mapRef,
    handleCenterChanged,
    handleZoomChanged,
    defaultShowProducers: user?.role === UserRole.CONSUMER ? true : false,
  });

  // No need to adapt here since useMarkerLogic is already correct
  const {
    selectedMarker,
    handleMarkerClick,
    handleInfoWindowClose,
    handleMapClick,
  } = useMarkerLogic({
    mapRef,
    infoWindowRef,
    setCurrentCenter,
    setZoom,
  });

  // Render a loading component if the Google Maps script is not loaded
  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <div className="absolute h-screen w-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <MapHeader
            isDrawingEnabled={isDrawingEnabled}
            startDrawing={startDrawing}
            stopDrawing={stopDrawing}
            resetMap={resetMap}
            drawnShape={drawnShape}
            isApplyButtonVisible={isApplyButtonVisible}
            applyDrawnShape={applyDrawnShape}
          />

          {user && user?.role !== "CONSUMER" && (
            <div
              className={`${OutfitFont.className} inset-x-0 mx-auto w-[150px] 3xl:w-[200px] absolute top-12 flex items-center justify-center transform z-10 bg-white bg-opacity-75 rounded-lg pr-5 pointer-events-auto`}
            >
              <DrawingControls
                showCoops={showCoops}
                setShowCoops={setShowCoops}
                showProducers={showProducers}
                setShowProducers={setShowProducers}
              />
            </div>
          )}
        </div>
      </div>

      <div
        className={`relative flex-grow ${isDrawingEnabled ? "opacity-80" : ""}`}
      >
        <GoogleMapComponent
          mapRef={mapRef}
          mapOptions={mapOptions}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleMapClick={handleMapClick}
          showCoops={showCoops}
          showProducers={showProducers}
          filteredCoops={filteredCoops}
          filteredProducers={filteredProducers}
          handleMarkerClick={handleMarkerClick}
          selectedMarker={selectedMarker}
        />
      </div>

      {selectedMarker && (
        <MarkerInfoWindow
          infoWindowRef={infoWindowRef}
          selectedMarker={selectedMarker}
          handleInfoWindowClose={handleInfoWindowClose}
        />
      )}
    </div>
  );
};

export default VendorsMap;
