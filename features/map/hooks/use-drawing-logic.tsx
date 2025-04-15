import { useState, useRef, useCallback } from "react";
import { LocationInfo } from "../types/map-types";

interface UseDrawingLogicProps {
  coopInfo: LocationInfo[];
  producerInfo: LocationInfo[];
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  handleCenterChanged: () => void;
  handleZoomChanged: () => void;
  defaultShowProducers: boolean;
}

export const useDrawingLogic = ({
  coopInfo,
  producerInfo,
  mapRef,
  handleCenterChanged,
  handleZoomChanged,
  defaultShowProducers,
}: UseDrawingLogicProps) => {
  const [drawnShape, setDrawnShape] = useState<google.maps.LatLng[] | null>(
    null
  );
  const [filteredCoops, setFilteredCoops] = useState<LocationInfo[]>(coopInfo);
  const [filteredProducers, setFilteredProducers] =
    useState<LocationInfo[]>(producerInfo);
  const [showCoops, setShowCoops] = useState(true);
  const [showProducers, setShowProducers] = useState(defaultShowProducers);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [isApplyButtonVisible, setIsApplyButtonVisible] = useState(false);
  const [polylinePath, setPolylinePath] = useState<google.maps.LatLng[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const startDrawing = useCallback(() => {
    handleCenterChanged();
    handleZoomChanged();
    setShowCoops(false);
    setShowProducers(false);
    setIsDrawingEnabled(true);

    if (mapRef.current) {
      mapRef.current.setOptions({
        draggable: false,
        zoomControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: false,
        gestureHandling: "none",
      });
    }
  }, [handleCenterChanged, handleZoomChanged, mapRef]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setIsDrawingEnabled(false);
    setPolylinePath([]);
    setIsApplyButtonVisible(false);
    setShowCoops(true);
    setShowProducers(true);
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.setOptions({
        draggable: true,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        gestureHandling: "greedy",
      });
    }
  }, [mapRef]);

  const handleMouseDown = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (isDrawingEnabled && event.latLng) {
        setIsDrawing(true);
        const path = polylineRef.current?.getPath();
        if (path) {
          path.push(event.latLng);
          setPolylinePath(path.getArray());
        } else {
          const polyline = new google.maps.Polyline({
            strokeColor: "#008080",
            strokeWeight: 2,
            clickable: false,
            editable: false,
            zIndex: 1,
          });
          polyline.setMap(mapRef.current);
          polylineRef.current = polyline;
          polyline.getPath().push(event.latLng);
          setPolylinePath(polyline.getPath().getArray());
        }
      }
    },
    [isDrawingEnabled, mapRef]
  );

  const handleMouseMove = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (isDrawing && event.latLng) {
        const path = polylineRef.current?.getPath();
        if (path) {
          path.push(event.latLng);
          setPolylinePath(path.getArray());
        }
      }
    },
    [isDrawing]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      const path = polylineRef.current?.getPath();
      if (path && path.getLength() > 2) {
        const firstPoint = path.getAt(0);
        const lastPoint = path.getAt(path.getLength() - 1);
        if (firstPoint && lastPoint) {
          path.push(firstPoint);
          setPolylinePath(path.getArray());
        }
      }
      setIsApplyButtonVisible(true);
    }
  }, [isDrawing]);

  const applyDrawnShape = useCallback(() => {
    const coordinates = polylineRef.current?.getPath().getArray() || [];
    setDrawnShape(coordinates);

    const polygonPath = coordinates.map((latLng) => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));

    const polygon = new google.maps.Polygon({
      paths: polygonPath,
    });

    const newFilteredCoops = coopInfo.filter((coop: LocationInfo) => {
      const coopLatLng = new google.maps.LatLng(
        coop.coordinates.lat,
        coop.coordinates.lng
      );

      return google.maps.geometry.poly.containsLocation(coopLatLng, polygon);
    });

    const newFilteredProducers = producerInfo.filter(
      (producer: LocationInfo) => {
        const producerLatLng = new google.maps.LatLng(
          producer.coordinates.lat,
          producer.coordinates.lng
        );

        return google.maps.geometry.poly.containsLocation(
          producerLatLng,
          polygon
        );
      }
    );

    setFilteredCoops(newFilteredCoops);
    setFilteredProducers(newFilteredProducers);
    stopDrawing();
  }, [coopInfo, producerInfo, stopDrawing]);

  const resetMap = useCallback(() => {
    handleCenterChanged();
    handleZoomChanged();
    setFilteredCoops(coopInfo);
    setFilteredProducers(producerInfo);
    setShowCoops(true);
    setShowProducers(defaultShowProducers);
    setDrawnShape(null);
  }, [
    coopInfo,
    producerInfo,
    handleCenterChanged,
    handleZoomChanged,
    defaultShowProducers,
  ]);

  return {
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
  };
};
