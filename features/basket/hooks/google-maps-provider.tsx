import React, { createContext, useContext, ReactNode } from "react";
import { useLoadScript, Libraries } from "@react-google-maps/api";

interface GoogleMapsContextType {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(
  undefined
);

interface GoogleMapsProviderProps {
  children: ReactNode;
  googleMapsApiKey: string;
}

const libraries: Libraries = ["places", "geometry"];

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
  googleMapsApiKey,
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey,
    libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};
