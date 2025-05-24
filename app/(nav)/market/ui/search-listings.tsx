"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoadScript } from "@react-google-maps/api";
import qs from "query-string";
import debounce from "lodash/debounce";
import Fuse from "fuse.js";

// Icons
import { IoIosSearch } from "react-icons/io";
import { PiBasketThin, PiMapTrifoldThin } from "react-icons/pi";

// Font
import { OutfitFont } from "@/components/fonts";
import { Libraries } from "@googlemaps/js-api-loader";

// Type definitions
type Coordinates = {
  lat: number;
  lng: number;
};

type Listing = {
  id: string;
  title: string;
  subCategory?: string;
};

type SearchLocationProps = {
  apiKey: string;
};

const libraries: Libraries = ["places"];

const SearchLocation: React.FC<SearchLocationProps> = ({ apiKey }) => {
  // State management
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [focusedInput, setFocusedInput] = useState<"location" | "query" | null>(
    null
  );
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showListingSuggestions, setShowListingSuggestions] = useState(false);
  const [isLoadingListings, setIsLoadingListings] = useState(false);

  // References
  const locationInputRef = useRef<HTMLInputElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const placesServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load Google Maps
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Fetch all listings for search suggestions
  useEffect(() => {
    const fetchAllListings = async () => {
      try {
        const response = await fetch(`/api/listing/listingSuggestions`);
        const data = await response.json();
        if (data.listings) {
          setAllListings(data.listings);
        }
      } catch (error) {
        console.error("Error fetching all listings:", error);
      }
    };

    fetchAllListings();
  }, []);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    const options = {
      keys: ["title", "subCategory"],
      threshold: 0.6,
      distance: 100,
      ignoreLocation: true,
      shouldSort: true,
      minMatchCharLength: 3,
    };
    return new Fuse<Listing>(allListings, options);
  }, [allListings]);

  // Initialize Google Maps services when maps are loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      placesServiceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();

      // Check URL parameters for initial values
      initializeFromURL();
    }
  }, [isLoaded]);

  // Initialize from URL parameters or session storage
  const initializeFromURL = () => {
    const zip = searchParams?.get("zip");
    const q = searchParams?.get("q");
    const lat = searchParams?.get("lat");
    const lng = searchParams?.get("lng");

    if (zip && validateZipCode(zip)) {
      setAddress(zip);
      geocodeAddress(zip);
    }

    if (q) {
      setSearchQuery(q);
    }

    if (lat && lng) {
      setCoordinates({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });

      // If we have coordinates but no address, try to get the address
      if (!zip) {
        reverseGeocode(parseFloat(lat), parseFloat(lng));
      }
    }

    // Fallback to session storage if no URL params
    if (!zip && !lat && !lng) {
      loadFromSessionStorage();
    }
  };

  // Load previous search state from session storage
  const loadFromSessionStorage = () => {
    const storedState = sessionStorage.getItem("searchLocationState");
    if (storedState) {
      try {
        const { address, coordinates, searchQuery } = JSON.parse(storedState);
        setAddress(address || "");
        setCoordinates(coordinates || null);
        setSearchQuery(searchQuery || "");
        if (coordinates && searchQuery) {
          router.push(
            `/market?lat=${coordinates.lat}&lng=${coordinates.lng}&q=${searchQuery}&radius=20`
          );
        } else if (coordinates && !searchQuery) {
          router.push(
            `/market?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=20`
          );
        } else if (!coordinates && searchQuery) {
          router.push(`/market?q=${searchQuery}`);
        }
      } catch (error) {
        console.error("Failed to parse stored search state:", error);
      }
    }
  };

  // Save current search state to session storage
  const saveToSessionStorage = (listingName: string | null) => {
    const state = {
      address,
      coordinates,
      searchQuery: listingName ? listingName : searchQuery,
    };
    if (state.address === "") {
      state.coordinates = null;
    }
    sessionStorage.setItem("searchLocationState", JSON.stringify(state));
  };

  // Validate zip code format
  const validateZipCode = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  // Fetch place suggestions based on user input
  const fetchLocationSuggestions = debounce((input: string) => {
    if (!input || input.length < 2 || !placesServiceRef.current) return;

    // Create a custom "Near Me" suggestion
    const nearMeSuggestion: google.maps.places.AutocompletePrediction = {
      description: "Near Me (Use current location)",
      place_id: "near_me_custom_id",
      structured_formatting: {
        main_text: "Near Me",
        main_text_matched_substrings: [],
        secondary_text: "Use current location",
      },
      matched_substrings: [],
      terms: [],
      types: [],
    };

    placesServiceRef.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "us" },
        types: ["geocode", "establishment"],
      },
      (predictions, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          // Add Near Me option as the first suggestion
          const allSuggestions = [nearMeSuggestion, ...predictions];
          setSuggestions(allSuggestions);
          setShowLocationSuggestions(true);
        } else {
          // Even if there are no Google suggestions, still show Near Me
          setSuggestions([nearMeSuggestion]);
          setShowLocationSuggestions(true);
        }
      }
    );
  }, 300);

  // Geocode an address to get coordinates
  const geocodeAddress = (address: string) => {
    if (!address || !geocoderRef.current) return;

    geocoderRef.current.geocode({ address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        setCoordinates({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        console.error("Geocoding failed:", status);
        setCoordinates(null);
      }
    });
  };

  // Reverse geocode coordinates to get an address
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          console.error("Reverse geocoding failed:", status);
        }
      }
    );
  };

  // Handle user selecting a location suggestion
  const handleLocationSelect = (
    suggestion: google.maps.places.AutocompletePrediction
  ) => {
    setShowLocationSuggestions(false);

    // Check if this is our custom "Near Me" option
    if (suggestion.place_id === "near_me_custom_id") {
      handleNearMeClick();
      return;
    }

    if (!geocoderRef.current) return;

    setAddress(suggestion.description);

    geocoderRef.current.geocode(
      { placeId: suggestion.place_id },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          setCoordinates({
            lat: location.lat(),
            lng: location.lng(),
          });
        }
      }
    );

    locationInputRef.current?.blur();
  };

  // Handle getting user's current location
  const handleNearMeClick = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoordinates({ lat, lng });
        setAddress("Near Me");
        setShowLocationSuggestions(false);

        // Optionally get the actual address
        reverseGeocode(lat, lng);

        // Keep focus on location input
        locationInputRef.current?.focus();
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  // Search term preprocessing
  const preprocessTerm = (term: string) =>
    term
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .toLowerCase()
      .trim();

  // Remove duplicate listings
  const removeDuplicates = (listings: Listing[]): Listing[] => {
    const uniqueListings = new Map<string, Listing>();
    listings.forEach((listing) => {
      const key = `${listing.title}`;
      if (!uniqueListings.has(key)) {
        uniqueListings.set(key, listing);
      }
    });
    return Array.from(uniqueListings.values());
  };

  // Search using a single term
  const searchSingleTerm = (term: string): Listing[] => {
    const preprocessedTerm = preprocessTerm(term);
    return fuse.search(preprocessedTerm).map((result) => result.item);
  };

  // Search using multiple terms
  const searchMultipleTerms = (
    terms: string[],
    originalQuery: string
  ): Listing[] => {
    const preprocessedQuery = preprocessTerm(originalQuery);
    return allListings.filter((listing) => {
      const preprocessedTitle = preprocessTerm(listing.title);
      const preprocessedSubCategory = preprocessTerm(listing.subCategory || "");

      if (
        preprocessedTitle.includes(preprocessedQuery) ||
        preprocessedSubCategory.includes(preprocessedQuery)
      ) {
        return true;
      }

      return terms.every((term) => {
        const preprocessedTerm = preprocessTerm(term);
        return (
          preprocessedTitle.includes(preprocessedTerm) ||
          preprocessedSubCategory.includes(preprocessedTerm)
        );
      });
    });
  };

  // Advanced search function using Fuse.js
  const handleSearchName = debounce((query: string) => {
    if (!query) {
      setListings([]);
      setShowListingSuggestions(false);
      return;
    }

    setIsLoadingListings(true);

    try {
      const searchTerms = query.split(/\s+/).filter((term) => term.length > 0);

      let searchResults;
      if (searchTerms.length === 1) {
        searchResults = searchSingleTerm(searchTerms[0]);
      } else {
        const multiTermResults = searchMultipleTerms(searchTerms, query);
        searchResults =
          multiTermResults.length > 0
            ? multiTermResults
            : searchSingleTerm(query);
      }

      // Ensure duplicates are removed before setting the state
      const uniqueResults = removeDuplicates(searchResults);
      setListings(uniqueResults.slice(0, 5));
      setShowListingSuggestions(true);
    } catch (error) {
      console.error("Error searching listings:", error);
      setListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, 300);

  // Handle user selecting a listing suggestion
  const handleListingSelect = (listing: Listing) => {
    setSearchQuery(listing.title);
    setShowListingSuggestions(false);
    handleSearch(listing.title);
    queryInputRef.current?.blur();
  };

  // Handle search form submission
  const handleSearch = (listingName: string | null) => {
    // Save state before navigation
    saveToSessionStorage(listingName);

    const query: Record<string, string | null> = {
      ...(searchQuery ? { q: listingName ? listingName : searchQuery } : {}),
      ...(!coordinates || !address
        ? {}
        : {
            lat: coordinates.lat.toString(),
            lng: coordinates.lng.toString(),
            radius: "20", // Default radius in miles
          }),
    };

    const url = qs.stringifyUrl(
      {
        url: "/market",
        query,
      },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  };

  // Handle keyboard events
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    inputType: "location" | "query"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (inputType === "location" && suggestions.length > 0) {
        handleLocationSelect(suggestions[0]);
      } else if (inputType === "query") {
        handleSearch(null);
      }
    }
  };

  // Effect for handling location input changes
  useEffect(() => {
    if (focusedInput === "location" && isLoaded) {
      // If input is blank, still show suggestions with Near Me
      if (!address) {
        const nearMeSuggestion: google.maps.places.AutocompletePrediction = {
          description: "Near Me (Use current location)",
          place_id: "near_me_custom_id",
          structured_formatting: {
            main_text: "Near Me",
            main_text_matched_substrings: [],
            secondary_text: "Use current location",
          },
          matched_substrings: [],
          terms: [],
          types: [],
        };
        setSuggestions([nearMeSuggestion]);
        setShowLocationSuggestions(true);
      } else {
        fetchLocationSuggestions(address);
      }
    } else {
      setShowLocationSuggestions(false);
    }
  }, [address, focusedInput, isLoaded]);

  // Effect for handling search query changes
  useEffect(() => {
    if (focusedInput === "query") {
      handleSearchName(searchQuery);
    } else {
      setShowListingSuggestions(false);
    }
  }, [searchQuery, focusedInput]);

  // If Google Maps is not loaded yet, show a simple loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center border rounded-full bg-white shadow-[0_0_5px_rgba(0,0,0,0.1)] w-full h-16">
        <div className="animate-pulse text-gray-400">Loading search...</div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center border rounded-full bg-white shadow-[0_0_5px_rgba(0,0,0,0.1)] justify-center relative w-full ${OutfitFont.className}`}
    >
      {/* Location Input */}
      <div className="relative w-full sm:w-1/2">
        <PiMapTrifoldThin className="absolute text-black z-10 left-2 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none" />
        <div className="absolute text-gray-600 z-10 left-9 top-2 font-medium transform text-sm select-none pointer-events-none">
          Where
        </div>
        <input
          ref={locationInputRef}
          type="text"
          placeholder="Everywhere"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onFocus={() => {
            setFocusedInput("location");
            setShowLocationSuggestions(true);
          }}
          onBlur={() => {
            setFocusedInput(null);
            setTimeout(() => setShowLocationSuggestions(false), 200);
          }}
          onKeyDown={(e) => handleKeyDown(e, "location")}
          className="w-full rounded-full px-4 pb-2 pt-6 pl-9 border-none placeholder-black text-black outline-none transition-all duration-200 cursor-text"
          autoComplete="off"
        />

        {/* Location Suggestions */}
        {showLocationSuggestions &&
          suggestions.length > 0 &&
          focusedInput === "location" && (
            <div className="absolute mt-1 text-black shadow-lg z-50 w-full max-w-full rounded-xl py-3 bg-white border">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className={`px-4 py-3 flex items-center text-sm hover:bg-gray-200 cursor-pointer ${
                    suggestion.place_id === "near_me_custom_id"
                      ? "bg-gray-50"
                      : ""
                  }`}
                  onMouseDown={() => handleLocationSelect(suggestion)}
                >
                  {suggestion.place_id === "near_me_custom_id" ? (
                    <div className="flex items-center">
                      <span className="font-medium">Near Me</span>
                      <span className="text-gray-500 text-xs ml-2">
                        (Use current location)
                      </span>
                    </div>
                  ) : (
                    <span className="overflow-hidden text-black overflow-ellipsis whitespace-nowrap">
                      {suggestion.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Query Input */}
      <div className="relative w-full sm:w-1/2 border-l-[1px]">
        <PiBasketThin className="absolute text-black z-10 left-2 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none" />
        <div className="absolute text-gray-600 z-10 left-9 top-2 font-medium transform text-sm select-none pointer-events-none">
          What
        </div>
        <input
          ref={queryInputRef}
          type="text"
          placeholder="Everything"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setFocusedInput("query");
            setShowListingSuggestions(true);
          }}
          onBlur={() => {
            setFocusedInput(null);
            setTimeout(() => setShowListingSuggestions(false), 200);
          }}
          onKeyDown={(e) => handleKeyDown(e, "query")}
          className="w-full rounded-full px-4 pb-2 pt-6 pl-9 placeholder-black border-none text-black outline-none transition-all duration-200 cursor-text"
          autoComplete="off"
        />

        {/* Listing Suggestions */}
        {showListingSuggestions &&
          listings.length > 0 &&
          focusedInput === "query" && (
            <div className="absolute bg-white max-w-[910px] h-auto w-full left-0 top-16 rounded-xl border py-3 z-50">
              {listings.map((listing) => (
                <div
                  key={listing.id || listing.title}
                  className="p-1 cursor-pointer hover:bg-gray-200"
                  onMouseDown={() => handleListingSelect(listing)}
                >
                  <div className="flex items-center justify-between w-full p-1 px-2">
                    <span>{listing.title}</span>
                    {listing.subCategory && (
                      <span className="text-sm text-gray-500">
                        {listing.subCategory}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <button
        onClick={() => handleSearch(null)}
        className="absolute right-3 text-black top-1/2 transform -translate-y-1/2 z-10"
      >
        <IoIosSearch className="text-2xl text-white bg-black rounded-full p-1" />
      </button>
    </div>
  );
};

export default SearchLocation;
