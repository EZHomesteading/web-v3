import { useCallback, useEffect, useState } from "react";
import { OutfitFont } from "@/components/fonts";
import { Hours } from "@/types";
import { NewStoreCoreProps } from "../utils/utils";

export function MonthsNewStoreStep({
  updateFormData,
  formData,
}: NewStoreCoreProps) {
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
    [formData.selectedMonths, updateFormData],
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
      formData.selectedMonths,
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
            className={`p-8 sm:p-12 rounded-xl border-[1px] shadow-md select-none ${OutfitFont.className
              } ${formData.selectedMonths && formData.selectedMonths.includes(index)
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
  selectedMonths: number[],
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

  const pickupPatterns = new Map();
  const deliveryPatterns = new Map();

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

  selectedMonths.forEach((monthIndex) => {
    const monthToProcess = new Date(currentYear, monthIndex, 1);
    const useNextYear = monthToProcess < currentDate;
    const yearToUse = useNextYear ? currentYear + 1 : currentYear;

    const daysInMonth = new Date(yearToUse, monthIndex + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(yearToUse, monthIndex, day);
      const dayOfWeek = dateObj.getDay();

      if (pickupPatterns.has(dayOfWeek)) {
        result.pickup.push({
          date: new Date(dateObj),
          timeSlots: [...pickupPatterns.get(dayOfWeek)],
          capacity: 0,
        });
      }

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
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  result.delivery.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return result;
}
