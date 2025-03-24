import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { useState, useEffect, useRef, useCallback } from "react";
import Loading from "@/components/secondary-loader";
import { Libraries } from "@googlemaps/js-api-loader";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
  Suggestion,
} from "react-places-autocomplete";
import Toast from "@/components/ui/toast";
import { OutfitFont } from "@/components/fonts";
import { NewLocProps } from "./helper-components";
import { formatAddress } from "@/utils/address";

const libraries: Libraries = ["places", "drawing", "geometry"];

interface Props extends NewLocProps {
  apiKey: string;
  numLocs?: number;
}

export function Address({ updateFormData, formData, apiKey, numLocs }: Props) {
  const fullAddress = formatAddress(formData.address || {});
  const [address, setAddress] = useState(fullAddress);
  const [currentCenter, setCurrentCenter] = useState<google.maps.LatLngLiteral>(
    formData?.coordinates
      ? {
          lat: formData.coordinates.lat,
          lng: formData.coordinates.lng,
        }
      : { lat: 38, lng: -79 }
  );
  const [zoom, setZoom] = useState(6);

  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: libraries,
    version: "3.58",
  });

  const handleLocationSelect = useCallback(
    (latLng: google.maps.LatLngLiteral) => {
      setCurrentCenter(latLng);
      setZoom(15);
    },
    []
  );

  const mapOptions: google.maps.MapOptions = {
    center: currentCenter,
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
    const disableDefaultTouchBehavior = (event: TouchEvent) => {
      event.preventDefault();
    };

    window.addEventListener("touchmove", disableDefaultTouchBehavior, {
      passive: false,
    });

    return () => {
      window.removeEventListener("touchmove", disableDefaultTouchBehavior);
    };
  }, []);

  const handleChange = (address: string) => {
    setAddress(address);
  };

  const handleSelect = async (selectedAddress: string) => {
    try {
      const results = await geocodeByAddress(selectedAddress);
      const latLng = await getLatLng(results[0]);

      const addressComponents = results[0].address_components;
      const street = [
        addressComponents.find((component) =>
          component.types.includes("street_number")
        )?.long_name,
        addressComponents.find((component) => component.types.includes("route"))
          ?.long_name,
      ]
        .filter((part): part is string => !!part)
        .join(" ");
      const city = addressComponents.find((component) =>
        component.types.includes("locality")
      )?.long_name;
      const state = addressComponents.find((component) =>
        component.types.includes("administrative_area_level_1")
      )?.short_name;
      const zip = addressComponents.find((component) =>
        component.types.includes("postal_code")
      )?.long_name;

      if (!street || !city || !state || !zip) {
        Toast({
          message:
            "There was an error getting the address you used, please use a legitimate address",
        });
        return;
      }

      updateFormData("address", {
        street: street,
        city: city,
        state: state,
        zip: zip,
      });
      updateFormData("coordinates", { lat: latLng.lat, lng: latLng.lng });
      setAddress(selectedAddress);
      handleLocationSelect(latLng);
    } catch (error) {
      console.error("Error selecting address:", error);
    }
  };

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <>
      <PlacesAutocomplete
        value={address}
        onChange={handleChange}
        onSelect={handleSelect}
      >
        {({ getInputProps, suggestions, getSuggestionItemProps }) => (
          <div className={`relative w-full`}>
            <div
              className={`absolute zmax top-2 right-1/2 transform translate-x-1/2`}
            >
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 256 256"
                height="20px"
                width="20px"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 bottom-1/2 transform translate-y-1/2"
              >
                <path d="M124,99.77V176a4,4,0,0,0,8,0V99.77a36,36,0,1,0-8,0ZM128,36a28,28,0,1,1-28,28A28,28,0,0,1,128,36ZM236,176c0,12.46-11.73,23.83-33,32-20.09,7.73-46.72,12-75,12s-54.89-4.25-75-12c-21.29-8.19-33-19.56-33-32,0-18.55,25.81-34.22,67.37-40.88A4,4,0,1,1,88.63,143C52.93,148.74,28,162.3,28,176c0,17.39,40.18,36,100,36s100-18.61,100-36c0-13.7-24.93-27.26-60.63-33a4,4,0,1,1,1.26-7.89C210.19,141.78,236,157.45,236,176Z"></path>
              </svg>
              <input
                {...getInputProps({
                  placeholder: "Search by address, city, zip, and state",
                  className: `${OutfitFont.className} p-3 rounded-full w-[300px] pl-10 shadow-xl text-sm`,
                })}
              />

              <div
                style={{
                  position: "absolute",
                  top: "105%",
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                }}
              >
                {suggestions
                  .slice(0, 3)
                  .map((suggestion: Suggestion, index: number) => {
                    const className = suggestion.active
                      ? "suggestion-item--active bg-green-100"
                      : "suggestion-item bg-white";
                    const style = {
                      backgroundColor: suggestion.active
                        ? "#fafafa"
                        : "#ffffff",
                      cursor: "pointer",
                      padding: ".5rem",
                      fontSize: "1rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    };
                    return (
                      <div
                        {...getSuggestionItemProps(suggestion, {
                          className,
                          style,
                        })}
                        key={suggestion.id || index}
                      >
                        <span className={`${OutfitFont.className}`}>
                          {suggestion.description}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </PlacesAutocomplete>
      <GoogleMap
        onLoad={(map) => {
          mapRef.current = map;
        }}
        mapContainerClassName="h-[500px] w-full max-w-lg rounded-lg shadow-lg"
        options={mapOptions}
      >
        {currentCenter.lat !== 38 && (
          <MarkerF
            position={currentCenter}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                customSvgMarker
              )}`,
              scaledSize: new google.maps.Size(200, 200),
              anchor: new google.maps.Point(100, 100),
            }}
          />
        )}
      </GoogleMap>
    </>
  );
}

const customSvgMarker = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="48" fill="rgba(42, 157, 244, 0.3)" stroke="rgba(42, 157, 244, 0.6)" stroke-width="2" />

</svg>
`;
