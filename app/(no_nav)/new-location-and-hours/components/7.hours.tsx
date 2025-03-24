import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PiTrashThin } from "react-icons/pi";
import {
  checkOverlap,
  convertMinutesToTimeString,
  convertTimeStringToMinutes,
} from "@/app/(nav)/(nav_and_side_bar_layout)/selling/(container-selling)/availability-calendar/(components)/helper-functions-calendar";
import TimePicker from "@/app/(nav)/(nav_and_side_bar_layout)/selling/(container-selling)/availability-calendar/(components)/time-slot";
import { NewLocProps } from "./index";
import { FulfillmentType } from "./4.fufillment";
import { Availability, Hours as HoursType, TimeSlot } from "@/types";
import Toast from "@/components/ui/toast";

interface StepSixProps extends NewLocProps {
  onComplete: () => void;
  onBack: () => void;
}

export function Hours({
  updateFormData,
  formData,
  onBack,
  onComplete,
}: StepSixProps) {
  const [timeSlots, setTimeSlots] = useState([{ open: 360, close: 1080 }]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const handleAddTimeSlot = () => {
    if (checkOverlap([timeSlots])) {
      toast.error(
        "Cannot add another set of hours because existing time slots overlap."
      );
      return;
    }
    const lastSlot = timeSlots[timeSlots.length - 1];

    if (lastSlot.close <= 1320) {
      const newOpenTime = lastSlot.close + 60;
      const newCloseTime = newOpenTime + 60;

      if (newCloseTime <= 1440) {
        setTimeSlots((prev) => [
          ...prev,
          {
            open: newOpenTime,
            close: newCloseTime,
          },
        ]);
      } else {
        setTimeSlots((prev) => [...prev, { open: 540, close: 1020 }]);
      }
    } else {
      setTimeSlots((prev) => [...prev, { open: 540, close: 1020 }]);
    }

    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
    setActiveTab(timeSlots.length);
  };
  const handleTabClick = (index: number) => setActiveTab(index);

  const handleDeleteSlot = (indexToDelete: number) => {
    setTimeSlots((prevSlots) =>
      prevSlots.filter((_, index) => index !== indexToDelete)
    );
    if (activeTab === indexToDelete) setActiveTab(0);
  };

  const getTabTitles = () => {
    return timeSlots.map((_, index) => {
      const suffix = index === 0 ? "st" : index === 1 ? "nd" : "rd";

      return {
        title: (
          <>
            {index === activeTab ? (
              `${getTitle(activeTab)} Hours Set`
            ) : (
              <>
                {index + 1}
                <sup>{suffix}</sup>
              </>
            )}
          </>
        ),
      };
    });
  };

  const getTitle = (index: number) => {
    if (index === 0) return "First";
    else if (index === 1) return "Second";
    else return "Third";
  };

  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const handleTimeSlotChange = (
    slotIndex: number,
    isOpenTime: boolean,
    newTime: string
  ) => {
    setTimeSlots((prevSlots) => {
      const newSlots = [...prevSlots];
      const minutes = convertTimeStringToMinutes(newTime);
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        [isOpenTime ? "open" : "close"]: minutes,
      };
      return newSlots;
    });
  };

  const handleSaveChanges = (): void => {
    // Validate time slots don't overlap
    if (checkOverlap([timeSlots])) {
      toast.error("Time slots overlap. Please adjust the hours.");
      return;
    }

    // Create a deep copy of current hours to avoid mutation issues
    const newHours: HoursType = {
      pickup: formData.hours?.pickup || [],
      delivery: formData.hours?.delivery || [],
    };

    // CRITICAL CHANGE: Only modify the hours for the service we're currently configuring
    // This preserves the other service's hours regardless of month/day selections

    // Filter out days being reconfigured ONLY from the current service
    if (formData.currentConfig === "pickup") {
      // Only modify pickup hours, leave delivery alone
      newHours.pickup = newHours.pickup.filter(
        (avail: Availability) =>
          !formData.selectedDays.includes(
            weekDays[new Date(avail.date).getDay()]
          )
      );
    } else if (formData.currentConfig === "delivery") {
      newHours.delivery = newHours.delivery.filter(
        (avail: Availability) =>
          !formData.selectedDays.includes(
            weekDays[new Date(avail.date).getDay()]
          )
      );
    } else {
      // For shared hours, update both services
      newHours.pickup = newHours.pickup.filter(
        (avail: Availability) =>
          !formData.selectedDays.includes(
            weekDays[new Date(avail.date).getDay()]
          )
      );
      newHours.delivery = newHours.delivery.filter(
        (avail: Availability) =>
          !formData.selectedDays.includes(
            weekDays[new Date(avail.date).getDay()]
          )
      );
    }

    // Determine which services to update
    const updatePickup: boolean =
      formData.currentConfig === "pickup" ||
      formData.fulfillmentStyle === FulfillmentType.PICKUP_ONLY ||
      formData.fulfillmentStyle === FulfillmentType.SHARED_HOURS;

    const updateDelivery: boolean =
      formData.currentConfig === "delivery" ||
      formData.fulfillmentStyle === FulfillmentType.DELIVERY_ONLY ||
      formData.fulfillmentStyle === FulfillmentType.SHARED_HOURS;

    // Create day to timeslot mapping
    const dayPatterns: Map<number, TimeSlot[]> = new Map();
    formData.selectedDays.forEach((day: string) => {
      dayPatterns.set(weekDays.indexOf(day), timeSlots);
    });

    // Generate availability entries for selected months and days
    const currentDate: Date = new Date();
    const currentYear: number = currentDate.getFullYear();

    // Add new availabilities
    formData.selectedMonths.forEach((monthIndex: number) => {
      const yearToUse: number =
        new Date(currentYear, monthIndex, 1) < currentDate
          ? currentYear + 1
          : currentYear;
      const daysInMonth: number = new Date(
        yearToUse,
        monthIndex + 1,
        0
      ).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj: Date = new Date(yearToUse, monthIndex, day);
        const dayOfWeek: number = dateObj.getDay();

        if (dayPatterns.has(dayOfWeek)) {
          const availability: Availability = {
            date: new Date(dateObj),
            timeSlots: [...dayPatterns.get(dayOfWeek)!],
            capacity: 0,
          };

          if (updatePickup) newHours.pickup.push(availability);
          if (updateDelivery) newHours.delivery.push(availability);
        }
      }
    });

    const sortByDate = (a: Availability, b: Availability): number =>
      new Date(a.date).getTime() - new Date(b.date).getTime();

    newHours.pickup.sort(sortByDate);
    newHours.delivery.sort(sortByDate);

    updateFormData("hours", newHours);

    // Track completed steps
    let completedSteps: Array<"pickup" | "delivery"> = [
      ...(formData.completedSteps || []),
    ];

    if (!formData.currentConfig) {
      Toast({
        message:
          "Please decide how you would liket to fufill orders before completing this step",
      });
      return;
    }

    if (formData.fulfillmentStyle === FulfillmentType.SHARED_HOURS) {
      if (!completedSteps.includes("pickup")) completedSteps.push("pickup");
      if (!completedSteps.includes("delivery")) completedSteps.push("delivery");
    } else if (
      formData.fulfillmentStyle === FulfillmentType.PICKUP_ONLY &&
      !completedSteps.includes("pickup")
    ) {
      completedSteps.push("pickup");
    } else if (
      formData.fulfillmentStyle === FulfillmentType.DELIVERY_ONLY &&
      !completedSteps.includes("delivery")
    ) {
      completedSteps.push("delivery");
    } else if (
      formData.fulfillmentStyle === FulfillmentType.SEPARATE_HOURS &&
      !completedSteps.includes(formData.currentConfig)
    ) {
      completedSteps.push(formData.currentConfig);
    }

    updateFormData("completedSteps", completedSteps);
    toast.success("Store hours updated successfully");
    onComplete();
  };
  return (
    <div className="flex flex-col min-h-[850px]" ref={containerRef}>
      {timeSlots.map(
        (slot, index) =>
          activeTab === index && (
            <div
              key={index}
              className={`absolute left-1/2 transform -translate-x-1/2 bg-white 
            ${index > 0 ? "animate-fadeIn" : ""}
            ${index === timeSlots.length - 1 ? "z-50" : "z-40"}`}
            >
              <div className="flex justify-start items-center mb-3 text-lg relative">
                {getTabTitles().map((tab, index) => (
                  <button
                    key={index}
                    className={`px-3  ${
                      activeTab === index ? "font-semibold border-b" : ""
                    }`}
                    onClick={() => handleTabClick(index)}
                  >
                    {tab.title}
                  </button>
                ))}

                <div>
                  {index !== 0 && (
                    <PiTrashThin
                      className=" text-red-500 hover:cursor-pointer absolute top-1/2 transform -translate-y-1/2 right-0"
                      onClick={() => handleDeleteSlot(index)}
                    />
                  )}
                </div>
              </div>
              <TimePicker
                top={true}
                value={convertMinutesToTimeString(slot.open)}
                onChange={(time) => handleTimeSlotChange(index, true, time)}
                isOpen={true}
              />
              <TimePicker
                top={false}
                value={convertMinutesToTimeString(slot.close)}
                onChange={(time) => handleTimeSlotChange(index, false, time)}
                isOpen={true}
              />
              {timeSlots.length >= 3 ? null : (
                <Button
                  onClick={handleAddTimeSlot}
                  className="h-12 w-full bg-slate-500/60 border mt-2"
                >
                  Add Another Set of Hours
                </Button>
              )}
              <Button
                onClick={handleSaveChanges}
                className="bg-slate-500/60 h-12 my-2 w-full border mb-10"
              >
                Save Changes
              </Button>
            </div>
          )
      )}
    </div>
  );
}
