import { Hours, UserRole, Address } from "@/types";
import { toast } from "sonner";
import { FulfillmentType } from "./steps/step4.fulfillment";

export interface NewStoreCoreProps {
  formData: NewStoreFormData;
  updateFormData: <K extends keyof NewStoreFormData>(
    field: K,
    value: NewStoreFormData[K]
  ) => void;
}

export type NewStoreFormData = {
  name: string;
  type: string;
  coordinates: number[];
  address: Address;
  hours: Hours;
  role: UserRole;
  fulfillmentStyle: FulfillmentType;
  selectedMonths: number[];
  selectedDays: string[];
  completedSteps: Array<"pickup" | "delivery">;
  currentConfig?: "pickup" | "delivery";
  bio: string;
};

export const InitialFormDataNewStore: NewStoreFormData = {
  name: "test",
  address: { street: "", state: "", city: "", zip: "" },
  coordinates: [],
  type: "Point",
  role: UserRole.CONSUMER,
  fulfillmentStyle: FulfillmentType.UNDECIDED,
  selectedMonths: [],
  selectedDays: [],
  hours: { delivery: [], pickup: [] },
  completedSteps: [],
  currentConfig: undefined,
  bio: "test",
};

export const ValidateFormDataNewStore = (
  formData: NewStoreFormData,
  step: number
): boolean => {
  if (step >= 2 && formData.role === UserRole.CONSUMER) {
    return false;
  }

  if (step >= 3 && !formData.address) {
    return false;
  }

  if (step >= 4 && !formData.fulfillmentStyle) {
    return false;
  }

  if (step >= 5 && formData.selectedMonths.length === 0) {
    return false;
  }

  return true;
};

export const getHeaderContent = (step: number) => {
  switch (step) {
    case 2:
      return {
        title: "Select a role",
        subtitles: [
          "Choose your role to determine trading relationships - who you can buy from and sell to. With a Co-op location, you'll have access to purchase from Growers. You can modify your location type anytime.",
        ],
      };
    case 3:
      return {
        title: "Add your Address",
        subtitles: [
          "Sellers can have up to three selling locations",
          "You may change the address at any time",
          "Your location is approximate until a buyer purchases from you",
        ],
      };
    case 4:
      return {
        title: "Personalize Your New Store",
        subtitles: [
          "Name your store and add a short description.",
          "You can add an image to help buyers identify your store",
        ],
      };
    case 5:
      return {
        title: "Select Trading Mode",
        subtitles: [
          "Choose how you want to trade with buyers",
          "You can offer pickup, delivery, or both",
        ],
      };
    default:
      return {
        title: "",
        subtitles: [""],
      };
  }
};

export const getCoordinatesFromAddress = async (
  formData: NewStoreFormData,
  formatAddress: (address: Address, options?: { delimiter: string }) => string,
  updateFormData: (field: "coordinates", value: number[]) => void,
  onSuccess: () => void,
  setIsLoading: (loading: boolean) => void
) => {
  setIsLoading(true);
  try {
    const addressString = formatAddress(formData.address, {
      delimiter: ", ",
    });

    if (!addressString) {
      toast.error("Please enter a valid address before continuing.");
      setIsLoading(false);
      return;
    }

    const coordinates = await tryPrimaryGeocodingService(addressString);

    if (coordinates) {
      updateFormData("coordinates", coordinates);
      onSuccess();
      return;
    }

    const googleCoordinates = await tryGoogleMapsGeocodingService(
      addressString
    );

    if (googleCoordinates) {
      updateFormData("coordinates", googleCoordinates);
      onSuccess();
      return;
    }

    toast.error(
      "Could not get location. Please try entering coordinates manually."
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    toast.error(
      "Could not get location. Please try entering coordinates manually."
    );
  } finally {
    setIsLoading(false);
  }
};

const tryPrimaryGeocodingService = async (
  addressString: string
): Promise<number[] | null> => {
  try {
    const params = new URLSearchParams({
      q: addressString,
      format: "json",
      addressdetails: "1",
      dedupe: "1",
      limit: "10",
      countrycodes: "us",
      bounded: "1",
      viewbox: "-87.63,47.28,-66.95,24.52",
    });

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_GEOCODING_API}?${params}`,
      {
        headers: {
          EZHomesteading: "ezh/1.0",
        },
      }
    );

    const data = await response.json();
    const usResults = data.filter(
      (item: any) => item.address?.country_code === "us"
    );

    if (usResults && usResults.length > 0) {
      const formattedSuggestions = usResults.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      if (formattedSuggestions && formattedSuggestions.length > 0) {
        return [formattedSuggestions[0].lng, formattedSuggestions[0].lat];
      }
    }

    return null;
  } catch (error) {
    console.error("Primary geocoding service error:", error);
    return null;
  }
};

const tryGoogleMapsGeocodingService = async (
  addressString: string
): Promise<number[] | null> => {
  try {
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      addressString
    )}&components=country:US&key=${process.env.EXPO_PUBLIC_MAPS_KEY_IOS}`;

    const googleResponse = await fetch(googleMapsUrl);
    const googleData = await googleResponse.json();

    if (
      googleData.status === "OK" &&
      googleData.results &&
      googleData.results.length > 0
    ) {
      const location = googleData.results[0].geometry.location;
      return [location.lat, location.lng];
    }

    return null;
  } catch (error) {
    console.error("Google Maps API error:", error);
    return null;
  }
};

export const monthsOfTheYear = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const daysOfTheWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
