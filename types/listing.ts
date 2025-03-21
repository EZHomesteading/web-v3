import { Location } from "./location";
import { User } from "./user";

export type Listing = {
  //mandatory fields, cannot exist without these
  id: string;
  userId: string;
  locationId: string;
  title: string;
  category: string;
  subcategory: string;
  images: string[];
  description: string;
  price: number;
  stock: number;
  minOrder: number;
  shelfLife: number; // days until expiration, -1 means no expiry
  rating: number[];
  createdAt: Date;

  //optional fields that should be completely omitted in the db if not present to avoid bloat
  harvestFeatures?: boolean;
  projectedStock?: number; // does this need to be refactored?
  SODT?: number;
  quantityType?: string;
  reports?: number;
  tags?: string[]; // change from keyWords
  emailList?: string[];
  smsList?: string[]; // for some reason theres an extra layer of abstraction here in the schema where its a time of notif list which is a list which is an array of strings
};

export type ListingWithLoc = Listing & {
  location: Location;
};

export type ListingWithLocAndUser = ListingWithLoc & {
  user: User;
};
