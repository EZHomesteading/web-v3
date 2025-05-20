export interface MapUser {
  coordinates: number[];
  id: string;
}

export interface LocationInfo {
  coordinates: number[];
  id: string;
}
interface images {
  images: string[];
}
export interface MarkerInfo {
  coordinates: number[];
  zip: number;
  name: string;
  listings: images[];
  user: {
    name: string;
    firstName: string;
    url: string;
    image: string;
  };
}
