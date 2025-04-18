import { Address } from "@/types";

export default async function getCoords(address: string) {
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      addressdetails: "1",
      dedupe: "1",
      limit: "1",
      countrycodes: "us",
      bounded: " 1",
      viewbox: "-87.63,47.28,-66.95,24.52",
    });

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_GEOCODING_API}?${params}`,
      {
        headers: {
          EZHomesteading: "ezh/1.0",
        },
      },
    );

    const data = await response.json();
    const usResults = data.filter(
      (item) => item.address?.country_code === "us",
    );

    const formattedSuggestions = usResults.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    if (!formattedSuggestions || formattedSuggestions?.length === 0) {
      return null;
    }

    return [formattedSuggestions[0].lat, formattedSuggestions[0].lng];
  } catch (error) {
    console.error(error);
  }
}

export function formatAddressToString(
  address: Partial<Address>,
  options: {
    includeZip?: boolean;
    includeCountry?: boolean;
    includeStreet?: boolean;
    countryName?: string;
    delimiter?: string;
  } = {},
): string {
  const {
    includeZip = false,
    includeStreet = false,
    includeCountry = false,
    countryName = "USA",
    delimiter = ", ",
  } = options;

  const parts: string[] = [];

  if (address.street && address.street.trim() && includeStreet) {
    parts.push(address.street.trim());
  }

  if (address.city && address.city.trim()) {
    if (address.state && address.state.trim()) {
      parts.push(`${address.city.trim()}, ${address.state.trim()}`);
    } else {
      parts.push(address.city.trim());
    }
  } else if (address.state && address.state.trim()) {
    parts.push(address.state.trim());
  }

  if (includeZip && address.zip && address.zip.trim()) {
    if (
      parts.length > 0 &&
      parts[parts.length - 1].includes(address.state || "")
    ) {
      parts[parts.length - 1] += ` ${address.zip.trim()}`;
    } else {
      parts.push(address.zip.trim());
    }
  }

  if (includeCountry && countryName) {
    parts.push(countryName);
  }

  return parts.join(delimiter);
}

export function parseAddressString(addressString: string): Partial<Address> {
  const address: Partial<Address> = {
    street: "",
    city: "",
    state: "",
    zip: "",
  };

  if (!addressString) return address;

  const cleanedAddress = addressString.replace(/, USA$/, "");
  const parts = cleanedAddress.split(", ");

  if (parts.length === 0) return address;

  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);

    if (stateZipMatch) {
      address.state = stateZipMatch[1];
      address.zip = stateZipMatch[2];
      address.city = parts[parts.length - 2];
    } else {
      address.state = parts[parts.length - 1];
      address.city = parts[parts.length - 2];

      const stateMatch = address.state.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
      if (stateMatch) {
        address.state = stateMatch[1];
        address.zip = stateMatch[2];
      }
    }

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

export function isAddressComplete(
  address: Partial<Address>,
  requiredFields: Array<keyof Address> = ["street", "city", "state"],
): boolean {
  return requiredFields.every(
    (field) =>
      address[field] !== undefined &&
      address[field] !== null &&
      address[field].trim() !== "",
  );
}
