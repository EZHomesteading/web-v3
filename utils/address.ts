import { Address, coordObj } from "@/types";

/**
 * Converts an address object to a formatted string
 * Handles missing or empty fields gracefully
 *
 * @param address The address object to format
 * @param options Optional configuration for formatting
 * @returns Formatted address string
 */
export function formatAddress(
  address: Partial<Address>,
  options: {
    includeZip?: boolean;
    includeCountry?: boolean;
    countryName?: string;
    delimiter?: string;
  } = {}
): string {
  const {
    includeZip = true,
    includeCountry = false,
    countryName = "USA",
    delimiter = ", ",
  } = options;

  // Filter out empty values
  const parts: string[] = [];

  if (address.street && address.street.trim()) {
    parts.push(address.street.trim());
  }

  // combine city and state if both exist
  if (address.city && address.city.trim()) {
    if (address.state && address.state.trim()) {
      parts.push(`${address.city.trim()}, ${address.state.trim()}`);
    } else {
      parts.push(address.city.trim());
    }
  } else if (address.state && address.state.trim()) {
    parts.push(address.state.trim());
  }

  // add ZIP if requested and it exists
  if (includeZip && address.zip && address.zip.trim()) {
    // if the array isn't empty and the last element contains the state, append zip to it
    if (
      parts.length > 0 &&
      parts[parts.length - 1].includes(address.state || "")
    ) {
      parts[parts.length - 1] += ` ${address.zip.trim()}`;
    } else {
      parts.push(address.zip.trim());
    }
  }

  // add country if requested
  if (includeCountry && countryName) {
    parts.push(countryName);
  }

  return parts.join(delimiter);
}

/**
 * Parses a formatted address string into an address object
 *
 * @param addressString The address string to parse
 * @returns Parsed address object
 */
export function parseAddressString(addressString: string): Partial<Address> {
  const address: Partial<Address> = {
    street: "",
    city: "",
    state: "",
    zip: "",
  };

  if (!addressString) return address;

  // Remove USA if present
  const cleanedAddress = addressString.replace(/, USA$/, "");
  const parts = cleanedAddress.split(", ");

  if (parts.length === 0) return address;

  // Handle different address formats
  if (parts.length >= 3) {
    // Check if the last part contains a ZIP code
    const lastPart = parts[parts.length - 1];
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);

    if (stateZipMatch) {
      // Last part contains state and ZIP
      address.state = stateZipMatch[1];
      address.zip = stateZipMatch[2];
      address.city = parts[parts.length - 2];
    } else {
      // Last part is just state
      address.state = parts[parts.length - 1];
      address.city = parts[parts.length - 2];

      // Check if state contains ZIP code
      const stateMatch = address.state.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
      if (stateMatch) {
        address.state = stateMatch[1];
        address.zip = stateMatch[2];
      }
    }

    // Street is everything else
    address.street = parts.slice(0, parts.length - 2).join(", ");
  } else if (parts.length === 2) {
    const lastPart = parts[1];
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);

    if (stateZipMatch) {
      address.state = stateZipMatch[1];
      address.zip = stateZipMatch[2];
    } else {
      address.state = lastPart;
    }

    address.city = parts[0];
  } else if (parts.length === 1) {
    address.street = parts[0];
  }

  return address;
}

/**
 * Checks if an address object has all required fields filled
 *
 * @param address The address object to validate
 * @param requiredFields Array of fields that must be present
 * @returns Boolean indicating if address is complete
 */
export function isAddressComplete(
  address: Partial<Address>,
  requiredFields: Array<keyof Address> = ["street", "city", "state"]
): boolean {
  return requiredFields.every(
    (field) =>
      address[field] !== undefined &&
      address[field] !== null &&
      address[field].trim() !== ""
  );
}

/**
 * Converts array coordinates to a coordinates object
 *
 * @param coords An array of [latitude, longitude]
 * @returns Coordinates object
 */
export function arrayToCoordinates(coords: number[]): coordObj | null {
  if (!coords || coords.length < 2) return null;

  return {
    lat: coords[1],
    lng: coords[0],
  };
}

/**
 * Converts a coordinates object to an array
 *
 * @param coords Coordinates object
 * @returns Array of [latitude, longitude]
 */
export function coordinatesToArray(coords: coordObj): number[] {
  return [coords.lat, coords.lng];
}

/**
 * Formats coordinates as a string
 *
 * @param coords Coordinates object
 * @param options Formatting options
 * @returns Formatted coordinates string
 */
export function formatCoordinates(
  coords: coordObj,
  options: {
    precision?: number;
    separator?: string;
    includeLabels?: boolean;
  } = {}
): string {
  const { precision = 6, separator = ", ", includeLabels = false } = options;

  if (!coords) return "";

  const lat = coords.lat.toFixed(precision);
  const lng = coords.lng.toFixed(precision);

  if (includeLabels) {
    return `Lat: ${lat}${separator}Lng: ${lng}`;
  }

  return `${lat}${separator}${lng}`;
}

/**
 * Calculates the distance between two coordinate points in kilometers
 * Using the Haversine formula
 *
 * @param coords1 First coordinate
 * @param coords2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coords1: coordObj,
  coords2: coordObj
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = degreesToRadians(coords2.lat - coords1.lat);
  const dLng = degreesToRadians(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(coords1.lat)) *
      Math.cos(degreesToRadians(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converts degrees to radians
 *
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Checks if coordinates are valid
 *
 * @param coords Coordinates to validate
 * @returns Boolean indicating if coordinates are valid
 */
export function isValidCoordinates(coords: any): coords is number[] {
  return (
    coords !== null &&
    typeof coords === "object" &&
    "lat" in coords &&
    "lng" in coords &&
    typeof coords.lat === "number" &&
    typeof coords.lng === "number" &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
}

/**
 * Parse coordinates from a string (various formats)
 * Handles formats like "40.7128, -74.0060", "40.7128 -74.0060", "40.7128°N 74.0060°W"
 *
 * @param input String containing coordinates
 * @returns Coordinates object or null if parsing failed
 */
export function parseCoordinatesString(input: string): coordObj | null {
  if (!input) return null;

  const standardPattern = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/;
  const standardMatch = input.match(standardPattern);

  if (standardMatch) {
    return {
      lat: parseFloat(standardMatch[1]),
      lng: parseFloat(standardMatch[2]),
    };
  }

  const degreePattern = /(\d+\.?\d*)°?\s*([NS])[,\s]+(\d+\.?\d*)°?\s*([EW])/i;
  const degreeMatch = input.match(degreePattern);

  if (degreeMatch) {
    const lat = parseFloat(degreeMatch[1]);
    const lng = parseFloat(degreeMatch[3]);

    return {
      lat: degreeMatch[2].toUpperCase() === "S" ? -lat : lat,
      lng: degreeMatch[4].toUpperCase() === "W" ? -lng : lng,
    };
  }

  return null;
}
