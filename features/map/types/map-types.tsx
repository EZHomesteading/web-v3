export interface MapUser {
  coordinates: number[];
  id: string;
}

export interface LocationInfo {
  coordinates: {
    lat: number;
    lng: number;
  };
  id: string;
}

export interface MarkerInfo {
  coordinates: { lat: number; lng: number };
  listings: {
    images: string[];
  };
  user: {
    name: string;
    firstName: string;
    url: string;
    image: string;
  };
}
