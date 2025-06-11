"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Clock, ShoppingCart } from "lucide-react";

interface DateCompatibility {
  date: string;
  compatible: boolean;
  overlapHours: number;
  overlapTimeRange?: string;
  dayName?: string;
  monthDay?: string;
  timeSlots?: any[];
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;

  return mins === 0
    ? `${displayHours}${period}`
    : `${displayHours}:${mins.toString().padStart(2, "0")}${period}`;
};

// Helper function to calculate time range string from the overlapHours data
const calculateTimeRangeFromBasketData = (
  incompatibleDays: DateCompatibility[]
) => {
  return incompatibleDays.map((day) => {
    // Use existing overlapTimeRange if present
    if (day.overlapTimeRange) return day;

    // Format the day name and month/day if not present
    const date = new Date(day.date);
    const dayName =
      day.dayName || date.toLocaleDateString("en-US", { weekday: "short" });
    const monthDay =
      day.monthDay ||
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Calculate time range based on compatibility
    let overlapTimeRange = "No available hours";
    if (day.compatible && day.overlapHours > 0) {
      overlapTimeRange = `${Math.floor(day.overlapHours)}h window`;
    }

    return {
      ...day,
      dayName,
      monthDay,
      overlapTimeRange,
    };
  });
};

const HoursWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  incompatibleDays,
  type,
  isFirstItem, // New prop to indicate if this is the first item
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  incompatibleDays: DateCompatibility[];
  type: "pickup" | "delivery";
  isFirstItem: boolean;
}) => {
  //console.log("Modal rendering with isFirstItem:", isFirstItem);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport on client-side
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint is 640px
    };

    // Initial check
    checkIfMobile();

    // Add resize listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Process the incompatible days to add time ranges if not already present
  //console.log(incompatibleDays);
  const processedDays = calculateTimeRangeFromBasketData(incompatibleDays);

  // Responsive content area class
  const contentAreaClass = isMobile
    ? "py-2 flex-grow overflow-y-auto mb-4"
    : "py-2 max-h-[60vh] overflow-y-auto";

  // First Item View - Show location hours
  // Updated dialog content for hours display
  if (isFirstItem) {
    // Helper function to get current week dates starting from today
    const getCurrentWeekDates = (): Date[] => {
      const today = new Date();
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return date;
      });
    };

    // Format time function (same as in HoursDisplay)
    const formatTime = (minutes: number): string => {
      const hour = Math.floor(minutes / 60);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}${ampm}`;
    };

    const weekDates = getCurrentWeekDates();

    // Create a map of processed days for easier lookup
    const hoursMap = new Map<string, any>(
      processedDays.map((day) => [new Date(day.date).toDateString(), day])
    );

    const firstDate = weekDates[0];
    const lastDate = weekDates[6];
    const monthRange =
      firstDate.getMonth() === lastDate.getMonth()
        ? firstDate.toLocaleString("en-US", { month: "long" })
        : `${firstDate.toLocaleString("en-US", {
            month: "short",
          })} - ${lastDate.toLocaleString("en-US", { month: "short" })}`;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-[95%] md:min-w-[60%]  xl:min-w-[50%]  2xl:min-w-[40%]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Location Operating Hours
            </DialogTitle>
            <DialogDescription>
              This is the first item in your basket. Here are the {type} hours
              available:
            </DialogDescription>
          </DialogHeader>

          <div className={contentAreaClass}>
            {/* Week Header */}
            <div className="flex items-center justify-center mb-3">
              <span className="text-sm font-medium text-gray-700">
                {monthRange} {firstDate.getFullYear()}
              </span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 text-xs mb-4">
              {weekDates.map((date, index) => {
                const isToday =
                  new Date().toDateString() === date.toDateString();
                const dayName = date.toLocaleString("en-US", {
                  weekday: "short",
                });
                const formattedDate = date.toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                });

                const dayHours = hoursMap.get(date.toDateString());
                const timeSlots = dayHours?.timeSlots || [];

                return (
                  <div
                    key={index}
                    className={`flex flex-col items-center p-2 rounded border ${
                      isToday
                        ? "font-semibold text-blue-600 bg-blue-50 border-blue-200"
                        : "text-gray-700 bg-gray-50"
                    }`}
                  >
                    <span className="font-medium mb-1">{dayName}</span>
                    <span className="text-gray-400 mb-2 text-xs">
                      {formattedDate}
                    </span>
                    {timeSlots.length > 0 ? (
                      <div className="flex flex-col items-center space-y-1">
                        {timeSlots.map((slot: any, slotIndex: number) => (
                          <span
                            key={slotIndex}
                            className="whitespace-nowrap text-xs"
                          >
                            {slot.openFormatted || formatTime(slot.open)}-
                            {slot.closeFormatted || formatTime(slot.close)}
                          </span>
                        ))}
                        {dayHours?.capacity !== undefined &&
                          dayHours.capacity > 0 && (
                            <span className="text-xs text-gray-500">
                              Cap: {dayHours.capacity}
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {dayHours?.overlapHours > 0
                          ? `${Math.floor(dayHours.overlapHours)}h`
                          : "Closed"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter
            className={`${
              isMobile ? "mt-auto pt-4 border-t" : ""
            } flex justify-end gap-2`}
          >
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className={isMobile ? "flex-1" : ""}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
              }}
              className={isMobile ? "flex-1" : ""}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Basket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Subsequent Items View - Show compatibility check
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[95%] md:min-w-[60%]  xl:min-w-[50%]  2xl:min-w-[40%]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hours Compatibility Check
          </DialogTitle>
          <DialogDescription>
            Here's the {type} hours compatibility with other items in your
            basket:
          </DialogDescription>
        </DialogHeader>
        <div className={contentAreaClass}>
          <ul className="space-y-2">
            {processedDays.map((day, index) => (
              <li
                key={index}
                className={`flex flex-wrap justify-between items-center p-2 rounded ${
                  day.compatible
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <span className="font-medium">
                  {day.dayName || ""} {day.monthDay || day.date}
                </span>
                <span className="text-sm mt-1 w-full sm:w-auto sm:mt-0">
                  {day.compatible
                    ? day.overlapTimeRange
                      ? `${day.overlapTimeRange}`
                      : `${Math.floor(day.overlapHours)}h overlap`
                    : "No compatible hours"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter
          className={`${
            isMobile ? "mt-auto pt-4 border-t" : ""
          } flex justify-end gap-2`}
        >
          <Button
            variant="outline"
            onClick={onClose}
            className={isMobile ? "flex-1" : ""}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} className={isMobile ? "flex-1" : ""}>
            Add Despite Schedule Conflict
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HoursWarningModal;
