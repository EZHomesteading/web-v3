import { Availability, Hours } from "@/types";

export interface TimeSlot {
  open: number; // Hour in 24-hour format
  close: number; // Hour in 24-hour format
}

export interface DayHours {
  date: string;
  timeSlots: TimeSlot[];
  capacity: number;
}

export interface LocationHours {
  // [key: string]: DayHours[] | undefined;
  pickup?: Availability[];
  delivery?: Availability[];
}

export interface ScoreResult {
  pickup: {
    workingmanScore: number;
    retireeScore: number;
    combinedScore: number;
  };
  delivery: {
    workingmanScore: number;
    retireeScore: number;
    combinedScore: number;
  };
}

export const getColor = (score: number) => {
  console.log(score, "score in get color");
  switch (score) {
    case 3:
      return "bg-green-500";
    case 2:
      return "bg-yellow-500";
    case 1:
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
};

export const getTextColor = (score: number) => {
  console.log(score, "score in get color");
  switch (score) {
    case 3:
      return "text-green-500";
    case 2:
      return "text-yellow-500";
    case 1:
      return "text-red-500";
    default:
      return "text-gray-400";
  }
};

export function calculateAvailabilityScores(hours: Hours | null): ScoreResult {
  return {
    pickup: calculateServiceScores(hours?.pickup || []),
    delivery: calculateServiceScores(hours?.delivery || []),
  };
}

function calculateServiceScores(hours: Availability[]) {
  let workingmanScore = 0;
  let retireeScore = 0;
  hours.forEach((hour) => {
    if (!hour.timeSlots) return;

    const dayOfWeek = new Date(hour.date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    const workingCoverage = calculateTimeSlotCoverage(
      hour.timeSlots,
      900,
      1140
    );

    const retireeCoverage = calculateTimeSlotCoverage(
      hour.timeSlots,
      600,
      1140
    );

    const weekendModifier = isWeekend ? (isSunday ? 0.3 : 0.1) : 1;

    workingmanScore += workingCoverage * weekendModifier;
    retireeScore += retireeCoverage * weekendModifier;
  });

  const normalizeScore = (score: number): number => {
    const maxPossibleScore = 7;
    const normalized = (score / maxPossibleScore) * 3;
    return Math.max(0, Math.min(3, Math.ceil(normalized)));
  };

  const finalWorkingmanScore = normalizeScore(workingmanScore);
  const finalRetireeScore = normalizeScore(retireeScore);

  const combinedScore = Math.ceil(
    (finalWorkingmanScore + finalRetireeScore) / 2
  );

  return {
    workingmanScore: finalWorkingmanScore,
    retireeScore: finalRetireeScore,
    combinedScore,
  };
}
function calculateTimeSlotCoverage(
  timeSlots: TimeSlot[],
  targetStart: number,
  targetEnd: number
): number {
  let totalCoverage = 0;
  const targetHours = targetEnd - targetStart;

  timeSlots.forEach((slot) => {
    const overlapStart = Math.max(slot.open, targetStart);
    const overlapEnd = Math.min(slot.close, targetEnd);
    if (overlapEnd > overlapStart) {
      totalCoverage += (overlapEnd - overlapStart) / targetHours;
    }
  });

  return Math.min(1, totalCoverage);
}
export const calculateExpiryDate = (createdAt: Date, shelfLife: number) => {
  if (shelfLife === 365000) return "Never";

  const createdDate = new Date(createdAt);
  const expiryDate = new Date(
    createdDate.getTime() + shelfLife * 24 * 60 * 60 * 1000
  );
  return expiryDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
export function pluralizeQuantityType(quantity: number, type: string) {
  if (quantity === 1) {
    return type;
  }

  switch (type.toLowerCase()) {
    case "lb":
      return "lbs";
    case "oz":
      return "oz";
    case "pint":
    case "quart":
    case "gallon":
    case "bushel":
    case "peck":
    case "crate":
    case "basket":
    case "clove":
    case "bag":
      return type + "s";
    case "box":
    case "bunch":
      return type + "es";
    case "dozen":
      return "dozen";
    case "each":
      return "items";
    case "none":
      return "";
    default:
      return type;
  }
}
