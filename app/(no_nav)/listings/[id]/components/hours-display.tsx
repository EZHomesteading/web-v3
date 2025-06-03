"use client";
import React, { useState } from "react";
import {
  Clock,
  Truck,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TimeSlot {
  open: number;
  close: number;
}

interface DayHours {
  date: string;
  timeSlots: TimeSlot[];
  capacity?: number;
}

interface Location {
  hours?: {
    pickup?: DayHours[];
    delivery?: DayHours[];
    [key: string]: DayHours[] | undefined;
  };
}

interface HoursDisplayProps {
  location: Location;
  className?: string;
  showWeeks?: number; // How many weeks to show initially (default 2)
}

const formatTime = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}${ampm}`;
};

const getWeekDates = (offset: number): Date[] => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + offset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });
};

const HoursSection = ({
  title,
  hours,
  icon: Icon,
  iconColor,
  weekOffset,
  setWeekOffset,
}: {
  title: string;
  hours: DayHours[];
  icon: React.ComponentType<any>;
  iconColor: string;
  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const navigateWeek = (direction: "prev" | "next") => {
    setWeekOffset((prev) => (direction === "next" ? prev + 1 : prev - 1));
  };

  const weekDates = getWeekDates(weekOffset);
  const hoursMap = new Map<string, DayHours>(
    hours.map((day) => [new Date(day.date).toDateString(), day])
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
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <h3 className="text-lg font-medium">{title}</h3>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateWeek("prev")}
          className="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {monthRange} {firstDate.getFullYear()}
        </span>
        <button
          onClick={() => navigateWeek("next")}
          className="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2 text-xs">
        {weekDates.map((date, index) => {
          const isToday = new Date().toDateString() === date.toDateString();
          const dayName = date.toLocaleString("en-US", { weekday: "short" });
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
                  {timeSlots.map((slot: TimeSlot, slotIndex: number) => (
                    <span key={slotIndex} className="whitespace-nowrap text-xs">
                      {formatTime(slot.open)}-{formatTime(slot.close)}
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
                <span className="text-gray-400 text-xs">Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HoursDisplay: React.FC<HoursDisplayProps> = ({
  location,
  className = "",
  showWeeks = 2,
}) => {
  const [pickupWeekOffset, setPickupWeekOffset] = useState(0);
  const [deliveryWeekOffset, setDeliveryWeekOffset] = useState(0);

  const pickupHours = location.hours?.pickup || [];
  const deliveryHours = location.hours?.delivery || [];

  // Don't render if no hours are available
  if (pickupHours.length === 0 && deliveryHours.length === 0) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-medium">Available Hours</h2>
        </div>
        <p className="text-gray-600">No hours information available.</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 bg-white ${className}`}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <Clock className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-medium">Available Hours</h2>
      </div>

      {pickupHours.length > 0 && (
        <HoursSection
          title="Pickup Hours"
          hours={pickupHours}
          icon={ShoppingBag}
          iconColor="text-green-600"
          weekOffset={pickupWeekOffset}
          setWeekOffset={setPickupWeekOffset}
        />
      )}

      {deliveryHours.length > 0 && (
        <HoursSection
          title="Delivery Hours"
          hours={deliveryHours}
          icon={Truck}
          iconColor="text-blue-600"
          weekOffset={deliveryWeekOffset}
          setWeekOffset={setDeliveryWeekOffset}
        />
      )}
    </div>
  );
};

export default HoursDisplay;
