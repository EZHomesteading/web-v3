"use client";
import React, { useEffect, useState } from "react";
import { Label } from "../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "../../../../components/ui/checkbox";
import Input from "../ui/listing-input";
import UnitSelect, { unitValue } from "../modals/unit-select";
import { CommonInputProps, InputProps } from "../../types/create";
import { Outfit } from "next/font/google";
import { PiBasketLight, PiRulerThin } from "react-icons/pi";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { UseFormSetValue, FieldValues } from "react-hook-form";

const outfit = Outfit({
  display: "swap",
  subsets: ["latin"],
});

interface StepThreeProps {
  role: string;
  unitFormValue: string | null; // This is what's in the form
  selectedUnitObject: unitValue | undefined; // This is the object for UnitSelect
  setSelectedUnitObject: (unit: unitValue | undefined) => void; // For updating the unit object
  setUnitFormValue: (value: string | null) => void; // For updating the form value
  postSODT: boolean;
  handleSODTCheckboxChange: (checked: boolean, index: number) => void;
  handleProjectHarvestCheckboxChange: (checked: boolean, index: number) => void;
  usersodt: number | null;
  commonInputProps: CommonInputProps;
  inputProps: InputProps;
  projectHarvest: boolean;
  setValue: UseFormSetValue<FieldValues>;
  title: string;
}

const StepThree: React.FC<StepThreeProps> = ({
  unitFormValue,
  selectedUnitObject,
  setSelectedUnitObject,
  setUnitFormValue,
  postSODT,
  handleSODTCheckboxChange,
  handleProjectHarvestCheckboxChange,
  projectHarvest,
  usersodt,
  commonInputProps,
  inputProps,
  setValue,
  title,
  role,
}) => {
  const [harvestDates, setHarvestDates] = useState<string[]>([]);

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

  const toggleMonth = (month: string) => {
    setHarvestDates((prevDates) => {
      const newDates = prevDates.includes(month)
        ? prevDates.filter((date) => date !== month)
        : [...prevDates, month];
      setValue("harvestDates", newDates);
      return newDates;
    });
  };

  // Determine the price label based on unit
  const handleUnitSelection = (selectedUnit: unitValue | undefined) => {
    setSelectedUnitObject(selectedUnit);

    if (selectedUnit) {
      setUnitFormValue(selectedUnit.value);
    } else {
      setUnitFormValue(null);
    }
  };

  // Determine the price label based on unit
  const getPriceLabel = () => {
    if (!selectedUnitObject || !selectedUnitObject.value) return "Price";
    if (
      selectedUnitObject.value === "each" ||
      selectedUnitObject.value === "none"
    ) {
      return "Price per item";
    } else {
      return `Price per ${selectedUnitObject.value}`;
    }
  };

  return (
    <div className="flex flex-col gap-4 min-h-screen fade-in">
      <div className="flex flex-row justify-center items-start gap-2">
        <div className="w-full sm:max-w-[500px] px-4">
          <div className="flex flex-col ">
            <Label className="text-xl w-full font-light m-0 !leading-0">
              Qualities of your Product{" "}
            </Label>
            <div className="text-xs font-extralight text-neutral-500 mb-2">
              Click the icons or help for more info
            </div>
            <div className="flex justify-between items-center mb-3">
              <div className="font-light">
                {title}: Is this product available now?
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleProjectHarvestCheckboxChange(true, 0)}
                  className={`p-2 text-sm border rounded ${
                    projectHarvest
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleProjectHarvestCheckboxChange(false, 0)}
                  className={`p-2 text-sm border rounded ${
                    !projectHarvest
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
            {!projectHarvest && (
              <div className="mb-4">
                <Label className="text-lg font-light mb-2">
                  When will it be available?
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {months.map((month) => (
                    <button
                      key={month}
                      onClick={() => toggleMonth(month)}
                      className={`p-2 text-sm border rounded ${
                        harvestDates.includes(month)
                          ? "bg-black text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="relative my-2">
              <Input
                {...commonInputProps}
                id={!projectHarvest ? "projectedStock" : "stock"}
                label={
                  !projectHarvest
                    ? "Estimated Seasonal Yield For Market"
                    : "Quantity"
                }
                type="number"
                maxlength={6}
                inputmode="numeric"
              />
              <PiBasketLight
                size={25}
                className="text-neutral-700 absolute top-5 right-2"
              />
            </div>

            <div className="relative">
              <UnitSelect
                selectedUnit={selectedUnitObject}
                onUnitChange={handleUnitSelection}
              />
              <PiRulerThin
                className="text-neutral-900 absolute top-5 right-2"
                size={25}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="relative ">
              <Input
                {...commonInputProps}
                id="minOrder"
                label="Minimum order"
                type="number"
                maxlength={4}
                inputmode="numeric"
              />
              <HiOutlineExclamationTriangle
                className="text-neutral-700 absolute top-5 right-2"
                size={25}
              />
            </div>
            <Input
              {...commonInputProps}
              id="price"
              label={getPriceLabel()}
              type="number"
              step="0.01"
              formatPrice
              maxlength={6}
              inputmode="decimal"
            />
          </div>
          <div className="m-0 p-0 md:mb-3 mt-5 border-black border-[1px] w-full"></div>

          <div className="w-full">
            <div className="flex flex-col gap-2 mt-2">
              <Label className="text-xl w-full font-light">
                Time to Prepare an Order
              </Label>
              <div className="relative">
                <Select
                  onValueChange={(value: string) => {
                    setValue("sodt", value);
                  }}
                >
                  <div className="flex flex-col items-start gap-y-3">
                    <SelectTrigger className="w-full h-1/6 text-black text-sm font-light p-5">
                      {usersodt ? (
                        <SelectValue placeholder={`${usersodt} Minutes `} />
                      ) : (
                        <SelectValue placeholder={"Select a Time"} />
                      )}
                    </SelectTrigger>
                    {!usersodt && inputProps.watch("sodt") !== null && (
                      <Checkbox
                        id="saveAsDefault"
                        checked={postSODT}
                        onCheckedChange={(checked: boolean) =>
                          handleSODTCheckboxChange(checked, 0)
                        }
                        label="Make this time to prepare your location default?"
                      />
                    )}
                  </div>
                  <SelectContent className="">
                    {role === "PRODUCER" ? (
                      <SelectGroup
                        className={`${outfit.className} text-xs font-light`}
                      >
                        <SelectItem value="60">1 Hour</SelectItem>
                        <SelectItem value="120">2 Hours</SelectItem>
                        <SelectItem value="180">3 Hours</SelectItem>
                        <SelectItem value="240">4 Hours</SelectItem>
                        <SelectItem value="300">5 Hours</SelectItem>
                        <SelectItem value="360">6 Hours</SelectItem>
                        <SelectItem value="420">7 Hours</SelectItem>
                        <SelectItem value="480">8 Hours</SelectItem>
                        <SelectItem value="540">9 Hours</SelectItem>
                        <SelectItem value="600">10 Hours</SelectItem>
                        <SelectItem value="660">11 Hours</SelectItem>
                        <SelectItem value="720">12 Hours</SelectItem>
                        <SelectItem value="780">13 Hours</SelectItem>
                        <SelectItem value="840">14 Hours</SelectItem>
                        <SelectItem value="900">15 Hours</SelectItem>
                        <SelectItem value="960">16 Hours</SelectItem>
                        <SelectItem value="1020">17 Hours</SelectItem>
                        <SelectItem value="1080">18 Hours</SelectItem>
                        <SelectItem value="1140">19 Hours</SelectItem>
                        <SelectItem value="1200">20 Hours</SelectItem>
                        <SelectItem value="1260">21 Hours</SelectItem>
                        <SelectItem value="1320">22 Hours</SelectItem>
                        <SelectItem value="1380">23 Hours</SelectItem>
                        <SelectItem value="1440">24 Hours</SelectItem>
                      </SelectGroup>
                    ) : (
                      <SelectGroup
                        className={`${outfit.className} text-xs font-light`}
                      >
                        <SelectItem value="15">15 Minutes</SelectItem>
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="45">45 Minutes</SelectItem>
                        <SelectItem value="60">1 Hour</SelectItem>
                        <SelectItem value="75">1 Hour 15 Minutes</SelectItem>
                        <SelectItem value="90">1 Hour 30 Minutes</SelectItem>
                        <SelectItem value="105">1 Hour 45 Minutes</SelectItem>
                        <SelectItem value="120">2 Hours</SelectItem>
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepThree;
