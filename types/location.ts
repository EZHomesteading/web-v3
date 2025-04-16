import { UserRole } from "@prisma/client";

export type Location = {
  //mandatory
  id: string;
  userId: string;
  type: string; // "Point"
  coordinates: Coordinates;
  address: Address;
  name: string; // if (!location.name) use user name in things like market page
  role: UserRole;
  bio: string;
  hours: Hours; // nullable to easily check if a user has hours but ensure its not undefined
  SODT: number | null; // nullable to differeniate between who has and hasnt set SODT, and if its null set it a default value when another user tries to buy like 24 hours
  isDefault: boolean;
  image: string | null; // if (!location.image) use user.image in things like market page
  createdAt: Date;
  updatedAt: Date;
};

export type TimeSlot = {
  open: number;
  close: number;
};

export type Availability = {
  date: Date;
  timeSlots: TimeSlot[];
  capacity: number | null;
};

export type Hours = {
  delivery: Availability[];
  pickup: Availability[];
};

export type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type LocationObj = {
  type: string;
  coordinates: Coordinates;
  address: Address;
  hours?: Hours;
  role: UserRole;
  isDefault: boolean;
};
