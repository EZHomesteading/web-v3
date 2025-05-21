"use client";
import { Input } from "@/components/ui/input";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  GoogleMap,
  Circle,
  MarkerF,
  Autocomplete,
  Libraries,
} from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateToMMMDDAtHourMin } from "@/features/availability-calendar/utils/helper-functions-calendar";

import useMediaQuery from "@/hooks/media-query";
import { Calendar } from "../../ui/calendar";
import TimePicker from "../modals/time.picker";
import RouteOptimizerModal from "../mapping/route-optimizer.modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LocationStatus {
  isOpen: boolean;
  willOpen: boolean;
  closesSoon: boolean;
  nextOpenTime?: string;
}

interface RandomizedPosition {
  originalLat: number;
  originalLng: number;
  randomLat: number;
  randomLng: number;
}

interface LocationStatuses {
  [key: string]: LocationStatus;
}

interface RandomizedPositions {
  [key: string]: RandomizedPosition;
}
interface DateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onSelect: (date: string, time: string) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}
interface AvailabilityMapProps {
  setStartLoc: React.Dispatch<React.SetStateAction<any[]>>;
  setEndLoc: React.Dispatch<React.SetStateAction<any[]>>;
  userLoc: any;
  mapsKey: string;
  setPickupTimes: any;
  locations: any[];
  startDelay: number;
  pickupTimes: any;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onSelect,
  isOpen,
  onClose,
  triggerRef,
}) => {
  const [step, setStep] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [tempTime, setTempTime] = useState(selectedTime);

  const handleDateSelect = (date: Date | undefined) => {
    setTempDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setTempTime(time);
  };

  const handleNext = () => {
    if (step === "date" && tempDate) {
      setStep("time");
    } else if (step === "time" && tempDate) {
      // Parse the time string into hours and minutes
      const [timeStr, period] = tempTime.split(" ");
      const [hours, minutes] = timeStr.split(":").map((num) => parseInt(num));

      // Convert to 24-hour format if PM
      let hour24 = hours;
      if (period === "PM" && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === "AM" && hours === 12) {
        hour24 = 0;
      }

      // Create a new date object with the selected date and time
      const dateWithTime = new Date(tempDate);
      dateWithTime.setHours(hour24);
      dateWithTime.setMinutes(minutes);
      dateWithTime.setSeconds(0);
      dateWithTime.setMilliseconds(0);

      onSelect(
        dateWithTime.toISOString().split("T")[0],
        `${hour24.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
      onClose();
      setStep("date"); // Reset for next open
    }
  };
  const getInitialPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0, width: 0, height: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };
  //const over_640px = useMediaQuery("(min-width: 750px)");

  const handleBack = () => {
    if (step === "time") {
      setStep("date");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed ${
              // over_640px ? "sm:bg-transparent" :
              "bg-white/80 backdrop-blur-md"
            } inset-0 z-[9998]`}
            onClick={onClose}
          />

          <motion.div
            initial={getInitialPosition()}
            animate={{
              top: "100px",
              left: "4px",
              right: "4px",
              bottom: "4px",
              width: "calc(100% - 8px)",
              height: "calc(100% - 8px)",
              opacity: 1,
            }}
            exit={getInitialPosition()}
            transition={{
              duration: 0.3,
              ease: [0.32, 0.72, 0, 1],
              width: { duration: 0.2 },
            }}
            className="bg-white rounded-3xl border shadow-xl z-[9999] fixed w-[90%] max-w-[500px] max-h-[500px]  xl:max-h-[600px]  mx-auto lg:mt-20 inset-0  overflow-hidden"
          >
            <div className="relative h-full bg-white rounded-3xl flex flex-col px-6 pb-6 pt-6">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">
                  {step === "date" ? "Select Date" : "Select Time"}
                </h2>
                {tempDate && step === "time" && (
                  <p className="text-sm text-gray-500">
                    {tempDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center">
                {step === "date" ? (
                  <div className="w-full max-w-sm mx-auto">
                    <Calendar
                      mode="single"
                      selected={tempDate}
                      onSelect={handleDateSelect}
                      className="rounded-md border shadow"
                      disabled={(date) => {
                        const today = new Date();
                        return date < new Date(today.setHours(0, 0, 0, 0));
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-sm mx-auto">
                    <TimePicker
                      top={false}
                      value={tempTime}
                      onChange={handleTimeSelect}
                      isOpen={true}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4">
                {step === "time" ? (
                  <Button variant="outline" onClick={handleBack}>
                    Back to Calendar
                  </Button>
                ) : (
                  <div /> // Empty div for spacing
                )}
                <Button
                  onClick={handleNext}
                  disabled={!tempDate || (step === "time" && !tempTime)}
                  className="flex items-center gap-2"
                >
                  {step === "date" ? "Next" : "Confirm"}
                  {step === "date" && <ChevronRight size={16} />}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
const libraries: Libraries = ["places", "geometry"];

const AvailabilityMap: React.FC<AvailabilityMapProps> = ({
  setStartLoc,
  setEndLoc,
  userLoc,
  locations,
  mapsKey,
  setPickupTimes,
  startDelay,
  pickupTimes,
}) => {
  // Early return if userLoc is invalid
  if (
    !userLoc ||
    !Array.isArray(userLoc) ||
    userLoc.length === 0 ||
    !userLoc[0]?.coordinates
  ) {
    return null;
  }

  const defaultCoords = { lat: 40.7128, lng: -74.006 }; // NYC coordinates as fallback

  // Safely access coordinates with fallback
  const initialCoordinates = (() => {
    try {
      const coord = {
        lat: userLoc[0]?.coordinates[1],
        lng: userLoc[0]?.coordinates[0],
      };
      return coord || defaultCoords;
    } catch (error) {
      return defaultCoords;
    }
  })();

  const mapRef = useRef<google.maps.Map | null>(null);

  // Use the static libraries array
  //const { isLoaded } = useGoogleMaps();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hereCoordinates, setHereCoordinates] = useState(initialCoordinates);
  const [isChangeLocationOpen, setIsChangeLocationOpen] = useState(false);
  const [initLoc, setInitLoc] = useState(() => {
    try {
      return (
        userLoc[0] || {
          coordinates: defaultCoords,
          address: "Default Location",
        }
      );
    } catch (error) {
      return { coordinates: defaultCoords, address: "Default Location" };
    }
  });

  const datePickerTriggerRef = useRef<HTMLButtonElement>(null);
  const [mapCenter, setMapCenter] = useState({
    lat: hereCoordinates.lat ?? defaultCoords.lat,
    lng: hereCoordinates.lng ?? defaultCoords.lng,
  });
  const [randomizedPositions, setRandomizedPositions] =
    useState<RandomizedPositions>({});
  const [locationStatuses, setLocationStatuses] = useState<LocationStatuses>(
    {}
  );
  const [enteredDate, setEnteredDate] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);
  const [unavailableLocations, setUnavailableLocations] = useState<
    Array<{
      name: string;
      nextOpenTime: string;
    }>
  >([]);
  // console.log("HERE", hereCoordinates[0]);
  const LocationSearchBox = useCallback(
    ({
      onPlaceSelect,
    }: //isLoaded,
    {
      onPlaceSelect: (address: string, coordinates: [number, number]) => void;
      // isLoaded: boolean;
    }) => {
      const locationInputRef = useRef<HTMLInputElement>(null);
      const locationSearchBoxRef =
        useRef<google.maps.places.Autocomplete | null>(null);

      //   if (!isLoaded)
      //   return <Input type="text" placeholder="Loading..." disabled />;

      return (
        <Autocomplete
          onLoad={(autocomplete) => {
            locationSearchBoxRef.current = autocomplete;
          }}
          onPlaceChanged={() => {
            if (locationSearchBoxRef.current) {
              const place = locationSearchBoxRef.current.getPlace();
              if (place.geometry?.location && place.formatted_address) {
                onPlaceSelect(place.formatted_address, [
                  place.geometry.location.lng(),
                  place.geometry.location.lat(),
                ]);
              }
            }
          }}
          options={{
            componentRestrictions: { country: "us" },
            fields: ["formatted_address", "geometry", "name"],
            types: ["address"],
          }}
        >
          <Input
            ref={locationInputRef}
            type="text"
            placeholder="Enter new address..."
            className="w-full text-lg p-4 h-12"
            onClick={(e) => e.stopPropagation()}
          />
        </Autocomplete>
      );
    },
    []
  );

  const [zoom, setZoom] = useState<number>(20);

  const getDisplayText = useCallback(() => {
    if (!selectedDate || !selectedTime) {
      return "Enter Departure Date and Time";
    }
    return formatDateToMMMDDAtHourMin(
      new Date(`${selectedDate}T${selectedTime}`)
    );
  }, [selectedDate, selectedTime]);

  const generateRandomOffset = useCallback((): number => {
    const maxOffset = 0.007;
    return (Math.random() - 0.5) * maxOffset;
  }, []);

  const handleDateTimeSelect = useCallback((date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  }, []);

  useEffect(() => {
    if (userLoc?.[0]?.coordinates) {
      setHereCoordinates({
        lat: userLoc[0].coordinates[1],
        lng: userLoc[0].coordinates[0],
      });
      setInitLoc(userLoc[0]);
      setMapCenter({
        lat: userLoc[0].coordinates[1],
        lng: userLoc[0].coordinates[0],
      });
    }
  }, [userLoc]);

  useEffect(() => {
    const newRandomPositions: RandomizedPositions = {};
    locations.forEach((location) => {
      if (!randomizedPositions[location.id] && location.coordinates) {
        const originalLat = location.coordinates[1];
        const originalLng = location.coordinates[0];
        newRandomPositions[location.id] = {
          originalLat,
          originalLng,
          randomLat: originalLat + generateRandomOffset(),
          randomLng: originalLng + generateRandomOffset(),
        };
      }
    });

    // Only update if we have new positions to add
    if (Object.keys(newRandomPositions).length > 0) {
      setRandomizedPositions((prev) => ({ ...prev, ...newRandomPositions }));
    }
  }, [locations, generateRandomOffset, randomizedPositions]);

  const handlePlaceSelect = useCallback(
    (address: string, coordinates: [number, number]) => {
      setInitLoc({
        address,
        coordinates,
      });
      setHereCoordinates({ lng: coordinates[0], lat: coordinates[1] });
      setMapCenter({
        lng: coordinates[0],
        lat: coordinates[1],
      });
      setIsChangeLocationOpen(false);
    },
    []
  );

  const findNextOpenTime = useCallback(
    (location: any, selectedDateTime: Date): string => {
      const hours = location.hours?.pickup;
      if (!hours?.length) return "No schedule available";

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Find today's or next available schedule
      const currentSchedule = hours.find((day: any) => {
        const scheduleDate = new Date(day.date);
        return scheduleDate.getTime() >= now.getTime();
      });

      if (!currentSchedule) return "No upcoming availability";

      const formatTime = (minutes: number) => {
        const hour = Math.floor(minutes / 60);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:00${ampm}`;
      };

      const formatDate = (date: Date) => {
        const day = date.getDate();
        const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : day % 10];
        return `${date.toLocaleString("en-US", {
          month: "short",
        })} ${day}${suffix}`;
      };

      const scheduleDate = new Date(currentSchedule.date);
      const { open } = currentSchedule.timeSlots[0];

      if (scheduleDate.getTime() === now.getTime()) {
        return `Opens today at ${formatTime(open)}`;
      }

      return `Opens on ${scheduleDate.toLocaleString("en-US", {
        weekday: "long",
      })} on ${formatDate(scheduleDate)}, at ${formatTime(open)}`;
    },
    []
  );

  const checkLocationAvailability = useCallback((): void => {
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time");
      return;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const timeInMinutes =
      selectedDateTime.getHours() * 60 + selectedDateTime.getMinutes();
    const unavailable: Array<{ name: string; nextOpenTime: string }> = [];
    const newStatuses: LocationStatuses = {};

    locations.forEach((location) => {
      const selectedDateSchedule = location.hours?.pickup?.find((day: any) => {
        const scheduleDate = new Date(day.date);
        return (
          scheduleDate.getDate() === selectedDateTime.getDate() &&
          scheduleDate.getMonth() === selectedDateTime.getMonth() &&
          scheduleDate.getFullYear() === selectedDateTime.getFullYear()
        );
      });

      const isOpen = selectedDateSchedule?.timeSlots[0]
        ? timeInMinutes >= selectedDateSchedule.timeSlots[0].open &&
          timeInMinutes <= selectedDateSchedule.timeSlots[0].close
        : false;

      newStatuses[location.id] = {
        isOpen,
        willOpen:
          selectedDateSchedule?.timeSlots[0] &&
          timeInMinutes < selectedDateSchedule.timeSlots[0].open,
        closesSoon:
          isOpen &&
          selectedDateSchedule?.timeSlots[0] &&
          selectedDateSchedule.timeSlots[0].close - timeInMinutes <= 60,
      };

      if (!isOpen) {
        unavailable.push({
          name: location.name || location.user?.name || "Unknown Location",
          nextOpenTime: findNextOpenTime(location, selectedDateTime),
        });
      }
    });

    setEnteredDate(true);
    setLocationStatuses(newStatuses);

    if (unavailable.length > 0) {
      setUnavailableLocations(unavailable);
      setShowUnavailableDialog(true);
    }
  }, [selectedDate, selectedTime, locations, findNextOpenTime]);

  useEffect(() => {
    const now = new Date();
    const timeInMinutes = now.getHours() * 60 + now.getMinutes();

    const initialStatuses: LocationStatuses = {};
    locations.forEach((location) => {
      const hours = location.hours?.pickup;
      const todaySchedule = hours?.find((day: any) => {
        const scheduleDate = new Date(day.date);
        const today = new Date();
        return (
          scheduleDate.getDate() === today.getDate() &&
          scheduleDate.getMonth() === today.getMonth() &&
          scheduleDate.getFullYear() === today.getFullYear()
        );
      });

      const isOpen = todaySchedule?.timeSlots[0]
        ? timeInMinutes >= todaySchedule.timeSlots[0].open &&
          timeInMinutes <= todaySchedule.timeSlots[0].close
        : false;

      initialStatuses[location.id] = {
        isOpen,
        willOpen:
          todaySchedule?.timeSlots[0] &&
          timeInMinutes < todaySchedule.timeSlots[0].open,
        closesSoon:
          isOpen &&
          todaySchedule?.timeSlots[0] &&
          todaySchedule.timeSlots[0].close - timeInMinutes <= 30,
      };
    });

    setLocationStatuses(initialStatuses);
  }, [locations]);

  const getLocationStatusColor = useCallback(
    (
      status: LocationStatus
    ): {
      fillColor: string;
      strokeColor: string;
      strokeWeight?: number;
    } => {
      if (!status.isOpen && status.willOpen) {
        return {
          fillColor: "red",
          strokeColor: "green",
          strokeWeight: 3,
        };
      } else if (!status.isOpen) {
        return {
          fillColor: "red",
          strokeColor: "red",
        };
      } else if (status.closesSoon) {
        return {
          fillColor: "yellow",
          strokeColor: "yellow",
        };
      }
      return {
        fillColor: "green",
        strokeColor: "green",
      };
    },
    []
  );

  const createDateFromStrings = useCallback(
    (dateStr: string, timeStr: string): Date => {
      return new Date(`${dateStr}T${timeStr}`);
    },
    []
  );
  console.log(initLoc);
  // if (!isLoaded) {
  //   return <div>Loading maps...</div>;
  // }

  return (
    <div className="mt-8">
      <RouteOptimizerModal
        startDelay={startDelay}
        setEndLoc={setEndLoc}
        setStartLoc={setStartLoc}
        selectedTime={createDateFromStrings(selectedDate, selectedTime)}
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        locations={locations}
        googleMapsApiKey={mapsKey}
        initialLocation={{
          lat: initLoc.coordinates[1],
          lng: initLoc.coordinates[0],
        }}
        setPickupTimes={setPickupTimes}
      />
      <Card className="p-4 mb-4">
        <div className="flex justify-center items-center gap-2 mb-4">
          <span>
            {enteredDate
              ? `If you depart from ${
                  initLoc.address.street
                } on ${getDisplayText()}, circles around
            sellers indicate their availability at that time.`
              : `If you depart from ${
                  initLoc.address.street
                } right now, circles around
            sellers indicate their availability. Please choose a departure time${" "}`}
          </span>
        </div>
        <div className=" w-full flex flex-col items-center">
          <style>{pulseAnimation}</style>
          <Button
            ref={datePickerTriggerRef}
            onClick={() => setIsDatePickerOpen(true)}
            className={`flex items-center justify-center w-full rounded-full border px-3 py-2 text-sm  hover:bg-gray-500 transition-colors`}
            style={
              !selectedDate || !selectedTime
                ? { animation: "pulse 2s infinite" }
                : {}
            }
          >
            {getDisplayText()}
          </Button>
        </div>
        <div className="flex px-1 justify-between pt-2 items-center">
          {" "}
          <Button
            variant="outline"
            size="default"
            onClick={checkLocationAvailability}
            className="w-48"
            disabled={!selectedDate || !selectedTime}
          >
            Check Availability
          </Button>
          <Popover
            open={isChangeLocationOpen}
            onOpenChange={setIsChangeLocationOpen}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-48">
                Change Location
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[500px] p-6 shadow-xl">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Change Departure Location
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter your new departure address
                  </p>
                </div>

                <div>
                  <LocationSearchBox
                    onPlaceSelect={handlePlaceSelect}
                    // isLoaded={isLoaded}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      <DateTimePicker
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSelect={handleDateTimeSelect}
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        triggerRef={datePickerTriggerRef}
      />

      {/* Unavailable Locations Dialog */}
      <Dialog
        open={showUnavailableDialog}
        onOpenChange={setShowUnavailableDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unavailable Locations</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500 mb-4">
              The following locations are closed at the selected time:
            </p>
            <div className="space-y-3">
              {unavailableLocations.map((loc, index) => (
                <div key={index} className="border-b pb-2">
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-sm text-gray-600">
                    Next available: {loc.nextOpenTime}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="h-[400px] rounded-lg overflow-hidden relative">
        {selectedDate && selectedTime && (
          <div>
            <style>{pulseAnimation}</style>
            <Button
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-green-600 hover:bg-green-700 shadow-lg"
              onClick={() => setIsRouteModalOpen(true)}
              style={
                selectedDate && selectedTime && !pickupTimes
                  ? { animation: "pulse 1s infinite" }
                  : {}
              }
            >
              Create a Route for {getDisplayText()}
            </Button>
          </div>
        )}
        <div className="h-[400px] rounded-lg overflow-hidden">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={mapCenter}
            zoom={9}
            onLoad={(map) => {
              mapRef.current = map;
              setZoom(map.getZoom() || 9);
            }}
            onZoomChanged={() => {
              if (mapRef.current) {
                setZoom(mapRef.current.getZoom() || 9);
              }
            }}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              minZoom: 6,
              maxZoom: 10,
              scaleControl: true,
            }}
          >
            <MarkerF
              position={
                new google.maps.LatLng(hereCoordinates.lat, hereCoordinates.lng)
              }
              icon={{
                url: "/icons/clipart2825061.png",
                scaledSize: new google.maps.Size(64, 76),
              }}
              title="Start Location"
            />
            {locations.map((location) => {
              const status = locationStatuses[location.id] || {
                isOpen: true,
                willOpen: false,
                closesSoon: false,
              };
              const colors = getLocationStatusColor(status);
              const position = randomizedPositions[location.id];

              if (!position) return null;

              return (
                <React.Fragment key={location.id}>
                  <Circle
                    center={
                      position.randomLat
                        ? new google.maps.LatLng(
                            position.randomLat,
                            position.randomLng
                          )
                        : new google.maps.LatLng(40, -80)
                    }
                    radius={
                      zoom >= 16
                        ? 60
                        : zoom >= 15
                        ? 120
                        : zoom >= 14
                        ? 240
                        : zoom >= 13
                        ? 500
                        : zoom >= 12
                        ? 1000
                        : zoom >= 11
                        ? 2000
                        : zoom >= 10
                        ? 4000
                        : 8000
                    }
                    options={{
                      strokeColor: colors.strokeColor,
                      strokeOpacity: 0.8,
                      strokeWeight: colors.strokeWeight || 2,
                      fillColor: colors.fillColor,
                      fillOpacity: 0.35,
                    }}
                  />
                  <MarkerF
                    position={
                      new google.maps.LatLng(
                        position.randomLat,
                        position.randomLng
                      )
                    }
                    label={{
                      text:
                        location.name || location.user.name || "no name found",
                      color: "black",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 0,
                    }}
                  />
                </React.Fragment>
              );
            })}
          </GoogleMap>
        </div>
      </div>

      <div className="mt-4 flex gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-600"></div>
          <span>Open</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span>Closing Soon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-600"></div>
          <span>Closed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_0_3px_#16a34a]"></div>
          <span>Opening Soon</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AvailabilityMap);
const pulseAnimation = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(10, 10, 246, 0.7);
    }
    80% {
      box-shadow: 0 0 0 10px rgba(10, 10, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(10, 10, 246, 0);
    }
  }
`;
