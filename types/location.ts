import { UserRole } from "@prisma/client";

export enum LocRole {
  COOP = "COOP",
  PRODUCER = "PRODUCER",
}
export type coordObj = { lat: number; lng: number };
export type Location = {
  id: string;
  userId: string;
  type: string;
  coordinates: number[];
  showPreciseLocation: boolean;
  address: Address;
  name: string;
  role: UserRole;
  bio: string | null;
  hours: Hours | null;
  SODT: number | null;
  isDefault: boolean;
  image: string | null;
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

export type LocationObj = {
  type: string;
  coordinates: number[];
  address: Address;
  hours?: Hours;
  role: UserRole;
  isDefault: boolean;
};

export interface AddressFields {
  street: string;
  city: string;
  state: string;
  zip: string;
  apt?: string;
}

export interface FormValues extends AddressFields {
  name: string | null | undefined;
  email: string | null | undefined;
  phone: string | undefined;
  oldPass?: string;
  newPass?: string;
  verifPass?: string;
  id?: string;
  url?: string;
  location?: any;
  image?: string;
}
