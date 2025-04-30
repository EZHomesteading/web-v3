import { Basket } from "@prisma/client";
import { Location } from "./location";
import { User } from "./user";

export type Listing = {
  //mandatory fields, cannot exist without these
  id: string;
  userId: string;
  locationId: string | null;
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
  unit: string;

  //optional fields that should be completely omitted in the db if not present to avoid bloat
  harvestDates?: string[] | undefined;
  harvestFeatures?: boolean | undefined;
  projectedStock?: number; // does this need to be refactored?
  SODT?: number;
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

export type ListingWithLocAndUserAndBasket = ListingWithLocAndUser & {
  basket: Basket;
};

export type ListingWithLocAndSeller = ListingWithLoc & {
  seller: User;
};
