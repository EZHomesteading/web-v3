import { Location } from "@prisma/client";

export const hasTimePassed = (
  timeInSeconds: number,
  selectedDate: Date,
  startDelay: number
): boolean => {
  const now = new Date();
  const timeDate = new Date(selectedDate);

  // Set the hours and minutes from the seconds
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  timeDate.setHours(hours, minutes, 0, 0);
  const delayTime = new Date(now.getTime() + startDelay * 60 * 1000);
  return timeDate < delayTime;
};

// Utility to get current time in seconds
export const getCurrentTimeInSeconds = (): number => {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
};

export const AVERAGE_STOP_TIME = 5 * 60;
export const BUFFER_TIME = 5 * 60;

// Utility functions remain the same
export const secondsToTimeString = (seconds: number): string => {
  // Ensure seconds is a valid number
  if (typeof seconds !== "number" || isNaN(seconds)) {
    console.error("Invalid seconds value:", seconds);
    seconds = 0; // Default to midnight rather than showing NaN
  }

  // Convert negative times to positive (add 24 hours until positive)
  while (seconds < 0) {
    seconds += 24 * 60 * 60;
  }

  // Handle times over 24 hours (normalize to 24-hour period)
  seconds = seconds % (24 * 60 * 60);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  // Convert to 12-hour format
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12;

  // Format the string (ensuring hours of 0 show as 12)
  return `${displayHours === 0 ? 12 : displayHours}:${String(minutes).padStart(
    2,
    "0"
  )} ${period}`;
};
export const getServiceWindow = (
  location: Location,
  selectedDate: Date
): {
  openTime: number;
  closeTime: number;
  windowSize: number;
} => {
  const dateString = selectedDate.toISOString().split("T")[0];
  const pickupSlot = location.hours?.pickup?.find(
    (slot) => new Date(slot.date).toISOString().split("T")[0] === dateString
  );

  const openTime = pickupSlot?.timeSlots[0]?.open || 0;
  const closeTime = pickupSlot?.timeSlots[0]?.close || 1440;

  return {
    openTime,
    closeTime,
    windowSize: closeTime - openTime,
  };
};
export const timeStringToSeconds = (timeString: string): number => {
  if (!timeString || typeof timeString !== "string") {
    console.error("Invalid time string:", timeString);
    return 0; // Default to midnight rather than returning NaN
  }

  try {
    // Parse time string format "HH:MM AM/PM"
    const [time, period] = timeString.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      console.error("Invalid time components:", timeString);
      return 0;
    }

    let totalHours = hours;

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) totalHours += 12;
    if (period === "AM" && hours === 12) totalHours = 0;

    return (totalHours * 60 + minutes) * 60;
  } catch (error) {
    console.error("Error parsing time string:", timeString, error);
    return 0; // Default to midnight on error
  }
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
};

export const metersToMiles = (meters: number): number => {
  return meters * 0.000621371;
};

// Location validation functions remain the same
export const getLocationOpenTime = (
  location: Location,
  targetDate: Date
): number => {
  const dateString = targetDate.toISOString().split("T")[0];
  const targetDeliverySlot = location.hours?.pickup?.find((slot) => {
    if (!slot) return false;
    return new Date(slot.date).toISOString().split("T")[0] === dateString;
  });

  if (!targetDeliverySlot?.timeSlots?.[0]) {
    return 0;
  }

  return targetDeliverySlot.timeSlots[0].open;
};
export const getLocationCloseTime = (
  location: Location,
  targetDate: Date
): number => {
  const dateString = targetDate.toISOString().split("T")[0];
  const targetDeliverySlot = location.hours?.pickup?.find((slot) => {
    if (!slot) return false;
    return new Date(slot.date).toISOString().split("T")[0] === dateString;
  });

  if (!targetDeliverySlot?.timeSlots?.[0]) {
    return 0;
  }

  return targetDeliverySlot.timeSlots[0].close;
};
export const isLocationOpen = (
  location: Location,
  timeInSeconds: number,
  targetDate: Date
): boolean => {
  const dateString = targetDate.toISOString().split("T")[0];
  const targetDeliverySlot = location.hours?.pickup?.find((slot) => {
    if (!slot) return false;
    return new Date(slot.date).toISOString().split("T")[0] === dateString;
  });

  if (!targetDeliverySlot?.timeSlots?.[0]) {
    return false;
  }

  return (
    timeInSeconds >= targetDeliverySlot.timeSlots[0].open * 60 &&
    timeInSeconds <= targetDeliverySlot.timeSlots[0].close * 60
  );
};
