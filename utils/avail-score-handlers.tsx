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
  [key: string]: DayHours[] | undefined;
  pickup?: DayHours[];
  delivery?: DayHours[];
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
  switch (score) {
    case 3:
      return "text-green-500";
    case 2:
      return "text-yellow-500";
    case 1:
      return "text-red-500";
    default:
      return "text-gray-300";
  }
};
export function calculateAvailabilityScores(
  hours: LocationHours | null | undefined
): ScoreResult {
  if (!hours) {
    return {
      pickup: { workingmanScore: 1, retireeScore: 1, combinedScore: 1 },
      delivery: { workingmanScore: 1, retireeScore: 1, combinedScore: 1 },
    };
  }

  return {
    pickup: calculateServiceScores(hours.pickup || []),
    delivery: calculateServiceScores(hours.delivery || []),
  };
}
function calculateServiceScores(hours: DayHours[]) {
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date.toISOString().split("T")[0];
  });

  const relevantHours = hours.filter((hour) => {
    const hourDate = new Date(hour.date).toISOString().split("T")[0];
    return next7Days.includes(hourDate);
  });

  let workingmanScore = 0;
  let retireeScore = 0;

  next7Days.forEach((date) => {
    const dayHours = relevantHours.find(
      (h) => new Date(h.date).toISOString().split("T")[0] === date
    );

    if (!dayHours) return;

    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    if (!dayHours.timeSlots || dayHours.timeSlots.length === 0) return;

    const workingCoverage = calculateTimeSlotCoverage(
      dayHours.timeSlots,
      960,
      1200
    );

    const retireeCoverage = calculateTimeSlotCoverage(
      dayHours.timeSlots,
      600,
      1200
    );

    const weekendModifier = isWeekend ? (isSunday ? 0.3 : 0.1) : 1;

    workingmanScore += workingCoverage * weekendModifier;
    retireeScore += retireeCoverage * weekendModifier;
  });

  const normalizeScore = (score: number): number => {
    const maxPossibleScore = 7;
    const normalized = (score / maxPossibleScore) * 4;
    return Math.max(1, Math.min(3, Math.ceil(normalized)));
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
