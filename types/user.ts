export interface User {
  //mandatory fields, when a user get created, their entire object should only be
  // id, name, email, *password*, createdAt but im not pulling even encrypted password down on client
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  totalPaidOut?: number;
  phoneNumber?: string;
  fullName?: FullName; //they dont have to have a full name but if they do it should be first and last or atleast first:str and last: ""
  stripeAccountId?: string;
  url?: string;
  image?: string;
  subscriptions?: string;
  hasPickedRole?: boolean;
  openClosedTemplates?: any;
  canRecievePayouts?: boolean;
  notifications?: Notification[];
  updatedAt?: Date;
}

export enum UserRole {
  ADMIN = "ADMIN",
  CONSUMER = "CONSUMER",
  COOP = "COOP",
  PRODUCER = "PRODUCER",
}

export type FullName = {
  first: string;
  last: string;
};

export enum Notification {
  SMS_ALL_ORDERS,
  EMAIL_ALL_ORDERS,
  SMS_NEW_ORDERS,
  EMAIL_NEW_ORDERS,
  SMS_ORDER_UPDATES,
  EMAIL_ORDER_UPDATES,
  SMS_ORDER_CANCELED,
  EMAIL_ORDER_CANCELED,
  SMS_ORDER_COMPLETED,
  EMAIL_ORDER_COMPLETED,
  SMS_FOLLOWED_USER_LISTING,
  EMAIL_FOLLOWED_USER_LISTING,
  SMS_NEW_PRODUCER_LISTINGS,
  EMAIL_NEW_PRODUCER_LISTINGS,
}
