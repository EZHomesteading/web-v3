import { GoogleMap, MarkerF, MarkerClusterer } from "@react-google-maps/api";
import { LocationInfo } from "../types/map-types";

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
}: GoogleMapComponentProps) => {
  return (
    <GoogleMap
      onLoad={(map) => {
        mapRef.current = map;
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      mapContainerClassName="h-[calc(100vh-64px)] w-screen"
      options={mapOptions}
      onClick={handleMapClick}
    >
      {showCoops && (
        <MarkerClusterer
          options={{
            imagePath: "https://i.ibb.co/r42S9tm/circle-2-2.png",
            gridSize: 100,
            maxZoom: 12,
            minimumClusterSize: 5,
          }}
        >
          {(clusterer) => (
            <>
              {filteredCoops.map((coop: LocationInfo, index: number) => (
                <MarkerF
                  key={`coop-${index}`}
                  position={
                    new google.maps.LatLng(
                      coop.coordinates[1],
                      coop.coordinates[0]
                    )
                  }
                  clusterer={clusterer}
                  icon={{
                    url: "https://utfs.io/f/f3a25818-2570-45d5-bc4c-cabe3ce88fe9-ie3okn.png",
                    scaledSize: new window.google.maps.Size(28, 28),
                    size: {
                      height: 28,
                      width: 28,
                      equals: () => true,
                    },
                    anchor: new window.google.maps.Point(30, 22),
                  }}
                  onClick={() => handleMarkerClick(coop.coordinates, coop.id)}
                />
              ))}
            </>
          )}
        </MarkerClusterer>
      )}

      {showProducers && (
        <MarkerClusterer
          options={{
            imagePath: "https://i.ibb.co/TMnKw45/circle-2.png",
            gridSize: 100,
            maxZoom: 12,
            minimumClusterSize: 5,
          }}
        >
          {(clusterer) => (
            <>
              {filteredProducers.map(
                (producer: LocationInfo, index: number) => (
                  <MarkerF
                    key={`producer-${index}`}
                    position={
                      new google.maps.LatLng(
                        producer.coordinates[1],
                        producer.coordinates[0]
                      )
                    }
                    icon={{
                      url: "https://utfs.io/f/ec4f6766-4c18-4752-a3b2-6030aed3cb33-os33pn.png",
                      scaledSize: new window.google.maps.Size(28, 28),
                      anchor: new window.google.maps.Point(25, 22),
                    }}
                    clusterer={clusterer}
                    onClick={() =>
                      handleMarkerClick(producer.coordinates, producer.id)
                    }
                  />
                )
              )}
            </>
          )}
        </MarkerClusterer>
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
