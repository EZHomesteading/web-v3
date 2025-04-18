import { Address, Hours, LocRole } from "./location";

export interface LocationObj {
  type: string;
  coordinates: number[];
  address: Address;
  hours: Hours;
  role: LocRole;
  isDefault: boolean;
}
