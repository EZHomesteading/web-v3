// types.ts
import { Location, UserRole } from "@prisma/client";

export interface RouteOptimizerProps {
  setStartLoc: React.Dispatch<React.SetStateAction<any[]>>;
  setEndLoc: React.Dispatch<React.SetStateAction<any[]>>;
  initialTime: Date;
  locations: any[];
  googleMapsApiKey: string;
  initialLocation: number[];
  onClose: () => void;
  setCartPickupTimes: any;
  isOpen: boolean;
  startDelay: number;
}
export interface initialLocation {
  lat: number;
  lng: number;
}
export interface ModalState {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  variant?: "default" | "destructive";
}

export interface TimeValidation {
  isValid: boolean;
  message: string;
}

export interface OptimalRoute {
  locations: Location[];
  suggestedPickupTimes: { [key: string]: string };
  totalDuration: number;
  totalDistance: number;
  segments: RouteSegment[];
}

export interface RouteSegment {
  location: Location;
  arrivalTime: number;
  pickupTime: number;
  departureTime: number;
  travelTime: number;
  distance: number;
  waitTime: number;
}

export interface RouteResult {
  route: Location[];
  totalTime: number;
  totalDistance: number;
  timings: RouteTimings;
}
export interface RouteTimings {
  segmentTimes: { [key: string]: number };
  returnTime: number;
  totalTime: number;
  totalDistance: number;
  suggestedPickupTimes: { [key: string]: string };
  distanceSegments: {
    [k: string]: number;
  };
}
import {
  basket_time_type,
  Hours,
  orderMethod,
  proposedLoc,
} from "@prisma/client";

// in use in /api/basket/get/unique and /basket/[id]
export interface Basket_ID_Page {
  id: string;
  proposedLoc?: proposedLoc | null;
  pickupDate: Date | null;
  deliveryDate: Date | null;
  orderMethod: orderMethod;
  time_type: basket_time_type;
  items: {
    quantity: number;
    price: number;
    listing: {
      id: string;
      title: string;
      quantityType: string;
      imageSrc: string[];
      stock: number;
      price: number;
      minOrder: number;
      shelfLife: string;
      rating: number[];
      createdAt: Date;
    };
  }[];
  location: {
    id: string;
    displayName: string;
    image: string | null;
    type: string;
    coordinates: number[] | null;
    address: string[] | null;
    hours: Hours;
    role: UserRole;
    user: {
      id: string;
      url?: string;
      name: string;
    };
  };
}
export interface Basket_Selected_Time_Type extends Basket_ID_Page {
  selected_time_type: string | null;
}
