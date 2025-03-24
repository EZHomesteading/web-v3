import { useCallback, useEffect, useState } from "react";
import { OutfitFont } from "@/components/fonts";
import { NewLocProps } from "./helper-components";
import { Hours } from "@/types";

export function Months({ updateFormData, formData }: NewLocProps) {
  const [isDragging, setIsDragging] = useState(false);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const toggleMonth = useCallback(
    (monthIndex: number) => {
      const newSelectedMonths =
        formData.selectedMonths && formData.selectedMonths.includes(monthIndex)
          ? formData.selectedMonths.filter((m) => m !== monthIndex)
          : [...(formData.selectedMonths || []), monthIndex];

      updateFormData("selectedMonths", newSelectedMonths);
    },
    [formData.selectedMonths, updateFormData]
  );

  const handleMouseDown = (monthIndex: number) => {
    setIsDragging(true);
    toggleMonth(monthIndex);
  };

  const handleMouseEnter = (monthIndex: number) => {
    if (isDragging) {
      toggleMonth(monthIndex);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!formData.selectedMonths || !formData.hours) return;

    const projection = generateAvailabilityProjection(
      formData.hours,
      formData.selectedMonths
    );

    updateFormData("hours", projection);
  }, [formData.selectedMonths]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="grid grid-cols-3 sm:grid-cols-4 gap-2"
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
      >
        {months.map((month, index) => (
          <button
            key={month}
            onMouseDown={() => handleMouseDown(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            className={`p-8 sm:p-12 rounded-xl border-[1px] shadow-md select-none ${
              OutfitFont.className
            } ${
              formData.selectedMonths && formData.selectedMonths.includes(index)
                ? "bg-[#ced9bb]/20 !border-[#ced9bb]"
                : "bg-white"
            }`}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
}

export function generateAvailabilityProjection(
  hours: Hours,
  selectedMonths: number[]
): Hours {
  if (!hours || !selectedMonths.length) {
    return { pickup: [], delivery: [] };
  }

  const result: Hours = {
    pickup: [],
    delivery: [],
  };

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Create a map of weekday patterns from existing hours
  const pickupPatterns = new Map();
  const deliveryPatterns = new Map();

  // Extract patterns for each day of week from existing hours
  hours.pickup.forEach((availability) => {
    const date = new Date(availability.date);
    const dayOfWeek = date.getDay(); // 0-6 for Sunday-Saturday
    pickupPatterns.set(dayOfWeek, availability.timeSlots);
  });

  hours.delivery.forEach((availability) => {
    const date = new Date(availability.date);
    const dayOfWeek = date.getDay();
    deliveryPatterns.set(dayOfWeek, availability.timeSlots);
  });

  // Project these patterns to all selected months
  selectedMonths.forEach((monthIndex) => {
    // Determine which year to use for this month
    const monthToProcess = new Date(currentYear, monthIndex, 1);
    const useNextYear = monthToProcess < currentDate;
    const yearToUse = useNextYear ? currentYear + 1 : currentYear;

    // Get number of days in the month
    const daysInMonth = new Date(yearToUse, monthIndex + 1, 0).getDate();

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(yearToUse, monthIndex, day);
      const dayOfWeek = dateObj.getDay();

      // Add pickup availability if we have a pattern for this day of week
      if (pickupPatterns.has(dayOfWeek)) {
        result.pickup.push({
          date: new Date(dateObj),
          timeSlots: [...pickupPatterns.get(dayOfWeek)],
          capacity: 0,
        });
      }

      // Add delivery availability if we have a pattern for this day of week
      if (deliveryPatterns.has(dayOfWeek)) {
        result.delivery.push({
          date: new Date(dateObj),
          timeSlots: [...deliveryPatterns.get(dayOfWeek)],
          capacity: 0,
        });
      }
    }
  });

  result.pickup.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  result.delivery.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return result;
}
