import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NewStoreCoreProps } from "../utils";

interface StepFiveProps extends NewStoreCoreProps {
  onComplete: (selectedDays: string[]) => void;
  onCompleteHours: () => void;
}

export default function DaysNewStoreStep({
  onComplete,
  onCompleteHours,
  formData,
  updateFormData,
}: StepFiveProps) {
  const [isDragging, setIsDragging] = useState(false);

  const fullWeekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [weekDays, setWeekDays] = useState<string[]>();

  const toggleDay = useCallback(
    (day: string) => {
      const newSelectedDays = formData.selectedDays.includes(day)
        ? formData.selectedDays.filter((d) => d !== day)
        : [...formData.selectedDays, day];

      updateFormData("selectedDays", newSelectedDays);
    },
    [formData.selectedDays, updateFormData],
  );

  const handleMouseDown = (day: string) => {
    setIsDragging(true);
    toggleDay(day);
  };

  const handleMouseEnter = (day: string) => {
    if (isDragging) {
      toggleDay(day);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNext = () => {
    if (formData.selectedDays.length === 0) {
      alert("Please select at least one day.");
      return;
    }

    const weekDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const currentDate = new Date();

    onComplete(formData.selectedDays);
  };

  useEffect(() => {
    const daysWithHours: string[] = [];

    formData.hours?.pickup.forEach((availability) => {
      const date = new Date(availability.date);
      const dayName = fullWeekDays[date.getDay()];
      if (!daysWithHours.includes(dayName)) {
        daysWithHours.push(dayName);
      }
    });

    formData.hours?.delivery.forEach((availability) => {
      const date = new Date(availability.date);
      const dayName = fullWeekDays[date.getDay()];
      if (!daysWithHours.includes(dayName)) {
        daysWithHours.push(dayName);
      }
    });

    setWeekDays(fullWeekDays.filter((day) => !daysWithHours.includes(day)));
  }, [formData.hours]);

  return (
    <>
      <div
        className="grid grid-cols-1 gap-2 mt-6"
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
      >
        {weekDays &&
          weekDays.map((day) => (
            <button
              key={day}
              onMouseDown={() => handleMouseDown(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              className={`p-2 px-20 border-[1px] text-2xl rounded-md shadow-sm ${formData.selectedDays.includes(day)
                  ? "bg-black text-white"
                  : "bg-white text-black"
                }`}
            >
              {day}
            </button>
          ))}
      </div>
      <div className="mt-2 space-y-2">
        <div
          className={`transition-all duration-500 ${formData.selectedDays.length > 0
              ? "opacity-100 h-12"
              : "opacity-0 h-0 overflow-hidden"
            }`}
        >
          <Button onClick={handleNext} className="h-12 w-full">
            Set Hours for Selected Days
          </Button>
        </div>

        <div
          className={`transition-all duration-500 ${weekDays && weekDays.length !== fullWeekDays.length
              ? "opacity-100 h-12"
              : "opacity-0 h-0 overflow-hidden"
            }`}
        >
          <Button
            onClick={onCompleteHours}
            className="h-12 w-full bg-green-200/40 text-black border"
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </>
  );
}
