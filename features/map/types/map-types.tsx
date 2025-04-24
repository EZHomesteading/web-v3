export interface MapUser {
  coordinates: number[];
  id: string;
}

export interface LocationInfo {
  coordinates: number[];
  id: string;
}

export interface MarkerInfo {
  coordinates: number[];
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
