import { addDays, format } from "date-fns";

export function getShelfLifeString(shelfLife?: number) {
  if (!shelfLife) {
    return "No Expiry Date Set";
  }
  if (shelfLife === -1) {
    return "No Expiry";
  }
  const now = new Date();
  const date = addDays(now, shelfLife);
  const dateString = format(date, "MMM dd, yyy");

  return `Estimated Expiry Date - ${dateString}`;
}

export function formatShelfLife(shelfLife?: number) {
  if (shelfLife === -1) {
    return "Doesnt Expire";
  }

  const now = new Date();
  const date = addDays(now, shelfLife as number);
  const dateString = format(date, "MMM dd, yyy");

  return `Estimated Expiry - ${dateString}`;
}

export function formatPrice(priceInCents: number) {
  if (typeof priceInCents !== "number") return "$0.00";

  const dollars = (priceInCents / 100).toFixed(2);

  if (parseFloat(dollars) < 1) {
    return `$${dollars.slice(1)}`;
  }

  return `$${dollars}`;
}
