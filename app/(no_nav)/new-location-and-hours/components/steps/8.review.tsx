import AvailabilityScore from "@/app/(nav)/(nav_market_layout)/market/(components)/availabilityScore";
import WeelkyScheduleChart from "../weekly-schedule-chart";
import { Clock } from "lucide-react";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { NewLocProps } from "./index";
import { Availability, Hours, TimeSlot } from "@/types";
import { OutfitFont } from "@/components/fonts";

interface ReviewLocProps extends NewLocProps {
  onFinish: (hours: any, fulfillmentStyle: string) => void;
  setStep: Dispatch<SetStateAction<number>>;
}

interface ScoreResult {
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

export function Review({
  formData,
  updateFormData,
  onFinish,
  setStep,
}: ReviewLocProps) {
  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [isDragging, setIsDragging] = useState<boolean>(false);

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

  // Simplified finish handlers that use the existing hours data
  const handleFinish = () => {
    // Simply pass the already-constructed hours data
    onFinish(formData.hours, formData.fulfillmentStyle);
  };

  const handleFinishBoth = (type: "sameForBoth" | "delivery" | "pickup") => {
    if (type === "sameForBoth") {
      // For "sameForBoth", simply use existing hours for both pickup and delivery
      onFinish(formData.hours, type);
    } else {
      // For one-sided fulfillment, reset the other type
      const updatedHours = {
        pickup: type === "pickup" ? formData.hours?.pickup || [] : [],
        delivery: type === "delivery" ? formData.hours?.delivery || [] : [],
      };

      updateFormData("hours", updatedHours);
      onFinish(updatedHours, type);
    }
  };

  function calculateAvailabilityScores(
    hours: Hours | null | undefined
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

  function calculateServiceScores(availabilities: Availability[]) {
    const today = new Date();
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return date.toISOString().split("T")[0];
    });

    const relevantAvailabilities = availabilities.filter((availability) => {
      const availDate = new Date(availability.date).toISOString().split("T")[0];
      return next7Days.includes(availDate);
    });

    let workingmanScore = 0;
    let retireeScore = 0;

    next7Days.forEach((date) => {
      const availability = relevantAvailabilities.find(
        (a) => new Date(a.date).toISOString().split("T")[0] === date
      );

      if (!availability) return;

      const dayOfWeek = new Date(date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;

      if (!availability.timeSlots || availability.timeSlots.length === 0)
        return;

      const workingCoverage = calculateTimeSlotCoverage(
        availability.timeSlots,
        960, // 4pm in minutes (16 * 60)
        1200 // 8pm in minutes (20 * 60)
      );

      const retireeCoverage = calculateTimeSlotCoverage(
        availability.timeSlots,
        600, // 10am in minutes (10 * 60)
        1200 // 8pm in minutes (20 * 60)
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

  const scores = calculateAvailabilityScores(formData?.hours);

  const getColor = (score: number) => {
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

  const pickupScore = scores["pickup"].combinedScore;
  const deliveryScore = scores["delivery"].combinedScore;
  const pickupColor = getColor(scores["pickup"].combinedScore);
  const deliveryColor = getColor(scores["delivery"].combinedScore);

  return (
    <>
      <AvailabilityFeedback
        hours={formData?.hours}
        scores={scores}
        pickupScore={pickupScore}
        deliveryScore={deliveryScore}
        pickupColor={pickupColor}
        deliveryColor={deliveryColor}
      />
      <ScheduleDisplay
        months={months}
        formData={formData}
        handleMouseDown={handleMouseDown}
        updateFormData={updateFormData}
        handleMouseEnter={handleMouseEnter}
        handleMouseUp={handleMouseUp}
        handleDayClick={() => {}}
      />
      <ActionButtonsNewLoc
        fulfillmentStyle={formData.fulfillmentStyle}
        handleFinish={handleFinish}
        handleFinishBoth={handleFinishBoth}
      />
    </>
  );
}

interface ScoreResult {
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

interface AvailabilityFeedbackProps {
  hours: Hours | undefined;
  scores: ScoreResult;
  pickupScore: number;
  deliveryScore: number;
  pickupColor: string;
  deliveryColor: string;
}

function AvailabilityFeedback({
  hours,
  scores,
  pickupScore,
  deliveryScore,
  pickupColor,
  deliveryColor,
}: AvailabilityFeedbackProps) {
  return (
    <div className="flex flex-col w-50 items-center justify-center gap-1 mt-2">
      {hours?.pickup?.length === 0 ? (
        <div className="text-red-500 font-medium flex items-center text-xs">
          <Clock size={14} className="mr-1" />{" "}
          <span className="font-medium capitalize">No Pickup Hours</span>
        </div>
      ) : (
        <AvailabilityScore scores={scores} type="pickup" />
      )}
      {hours?.delivery?.length === 0 ? (
        <div className="text-red-500 font-medium flex items-center text-xs">
          <Clock size={14} className="mr-1" />{" "}
          <span className="font-medium capitalize">No Delivery Hours</span>
        </div>
      ) : (
        <AvailabilityScore scores={scores} type="delivery" />
      )}
      {/* {hours?.pickup?.length === 0 ? null : (
        <div className={`flex items-center text-md w-[80%] ${pickupColor}`}>
          {pickupScore === 1
            ? "Your pickup availability might not fit most peoples schedules. While we understand that the best part of having your own store is that you get to choose the hours, we reccomend having a more broad schedule prioritizing times that most people are off work. Generally the hours of 4pm to 8pm for the average working individual, bonus points for catering to the retired population during the hours of around 10 am to 8 pm."
            : pickupScore === 2
            ? "Your pickup availability is pretty good, but it could be better. While we understand that the best part of having your own store is that you get to choose the hours, we reccomend having a more broad schedule prioritizing times that most people are off work. Generally the hours of 4pm to 8pm for the average working individual, bonus points for catering to the retired population during the hours of around 10 am to 8 pm."
            : pickupScore === 3
            ? "You have fantastic pickup availability, if you keep these hours whenever you have produce you will maximise sales!"
            : "ERROR"}
        </div>
      )}
      {hours?.delivery?.length === 0 ? null : (
        <div className={`flex items-center text-md w-[80%] ${deliveryColor}`}>
          {deliveryScore === 1
            ? "Your delivery availability might not fit most peoples schedules.While we understand that the best part of having your own store is that you get to choose the hours, we reccomend having a more broad schedule prioritizing times that most people are off work. Generally the hours of 4pm to 8pm for the average working individual, bonus points for catering to the retired population during the hours of around 10 am to 8 pm."
            : deliveryScore === 2
            ? "Your delivery availability is pretty good, but it could be better. While we understand that the best part of having your own store is that you get to choose the hours, we reccomend having a more broad schedule prioritizing times that most people are off work. Generally the hours of 4pm to 8pm for the average working individual, bonus points for catering to the retired populationj during the hours of around 10 am to 8 pm.."
            : deliveryScore === 3
            ? "You have fantastic delivery availability, if you keep these hours whenever you have produce you will maximise sales!"
            : "ERROR"}
        </div>
      )} */}
    </div>
  );
}

interface ScheduleDisplayProps extends NewLocProps {
  months: string[];
  handleMouseDown: (index: number) => void;
  handleMouseEnter: (index: number) => void;
  handleMouseUp: () => void;
  handleDayClick: (day: string) => void;
}

function ScheduleDisplay({
  months,
  formData,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
  handleDayClick,
}: ScheduleDisplayProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${OutfitFont.className}`}
    >
      <div className="flex flex-col mb-3">
        <h2 className="text-xl font-normal text-center">Month Schedule</h2>
        <h3 className="text-xs text-neutral-600 font-light text-center">
          Click a Month to Toggle
        </h3>
        <div className="rounded-lg px-0 sm:px-8 pt-1">
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
                  className={`p-8 2xl:p-[3.75rem] text-sm border-[1px] shadow-md rounded-md ${
                    formData?.selectedMonths &&
                    formData?.selectedMonths.includes(index)
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-[600px]">
        <WeelkyScheduleChart
          hours={formData.hours}
          currentConfig={formData?.currentConfig || "pickup"}
          handleDayClick={handleDayClick}
          barColor={`rgb(148 163 184)`}
          showSubTitle={true}
          viewBoxHeight={600}
          viewBoxWidth={750}
        />
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  fulfillmentStyle: string;
  handleFinish: () => void;
  handleFinishBoth: (type: "sameForBoth" | "delivery" | "pickup") => void;
}

export function ActionButtonsNewLoc({
  fulfillmentStyle,
  handleFinish,
  handleFinishBoth,
}: ActionButtonsProps) {
  return (
    <>
      {fulfillmentStyle === "sameForBoth" ? (
        <button
          onClick={() => handleFinishBoth("sameForBoth")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-green-800 fixed bottom-2 right-4 zmax"
        >
          Save Hours for Both
        </button>
      ) : fulfillmentStyle === "unique" ? (
        <button
          onClick={() => handleFinishBoth("delivery")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-green-800 fixed bottom-2 right-4 zmax"
        >
          Save Delivery Hours & Set Pickup Hours
        </button>
      ) : (
        <button
          onClick={handleFinish}
          className="px-4 py-2 bg-black text-white rounded hover:bg-green-800 fixed bottom-2 right-4 zmax"
        >
          Save Hours
        </button>
      )}
    </>
  );
}
