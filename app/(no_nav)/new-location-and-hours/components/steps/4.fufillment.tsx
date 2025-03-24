import {
  PiArrowsCounterClockwiseThin,
  PiCalendarBlankThin,
  PiCarProfileThin,
  PiStorefrontThin,
} from "react-icons/pi";
import { OutfitFont } from "@/components/fonts";
import { NewLocProps } from "./index";
import { ReactNode } from "react";

type Option = {
  label: string;
  icon: ReactNode;
  description: string[];
  value: FulfillmentType;
  currentConfig: "pickup" | "delivery";
  bg: string;
};

export enum FulfillmentType {
  PICKUP_ONLY = "pickup_only",
  DELIVERY_ONLY = "delivery_only",
  SHARED_HOURS = "shared_hours",
  SEPARATE_HOURS = "separate_hours",
  UNDECIDED = "undecided",
}

const options: Option[] = [
  {
    label: "Seperate Schedules",
    icon: <PiCalendarBlankThin size={24} />,
    description: [
      "Deliver or pickup depending on date and time",
      "Most common and recommended option",
    ],
    value: FulfillmentType.SEPARATE_HOURS,
    currentConfig: "pickup",
    bg: "bg-[#BED8D0]/40 !border-[#BED8D0]",
  },
  {
    label: "On-site Pickup",
    icon: <PiStorefrontThin size={24} />,
    description: [
      "All purchases and sales happen at this location",
      "Best for sellers who never want to deliver",
    ],
    value: FulfillmentType.PICKUP_ONLY,
    currentConfig: "pickup",
    bg: "bg-[#CED9BB]/40 !border-[#CED9BB]",
  },
  {
    label: "Delivery Only",
    icon: <PiCarProfileThin size={24} />,
    description: [
      "All purchases and sales handled via delivery",
      "Best for sellers who don't want visitors at this address",
    ],
    value: FulfillmentType.DELIVERY_ONLY,
    currentConfig: "delivery",
    bg: "bg-[#ADD8E6]/40 !border-[#ADD8E6]",
  },

  {
    label: "Shared Schedule",
    icon: <PiArrowsCounterClockwiseThin size={24} />,
    description: [
      "Use identical hours for delivery and pickup.",
      "Best for locations able to manage deliveries and on-site orders at the same times",
    ],
    value: FulfillmentType.SHARED_HOURS,
    currentConfig: "pickup",
    bg: "bg-amber-200/40 !border-amber-300",
  },
];

export function Fulfillment({ formData, updateFormData }: NewLocProps) {
  return (
    <div className="grid grid-cols-1 gap-2 w-full sm:max-w-[66%] mb-32 sm:grid-cols-2">
      {options.map((option: Option) => (
        <button
          key={option.value}
          onClick={() => {
            updateFormData("fulfillmentStyle", option.value);
            updateFormData("currentConfig", option.currentConfig);
          }}
          className={`${
            OutfitFont.className
          } flex flex-col items-justify-start text-start p-3 w-full rounded-lg border transition ${
            formData.fulfillmentStyle === option.value ? option.bg : "bg-white"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{option.icon}</span>
            <span className="text-base font-semibold">{option.label}</span>
          </div>
          {option.description.map((line: string, idx: number) => (
            <p
              key={idx}
              className={`text-xs py-[1px] text-neutral-500 ${
                idx === 2 && "!italic"
              }`}
            >
              {line}
            </p>
          ))}
        </button>
      ))}
    </div>
  );
}

export function getFulfillmentText(fulfillment?: string): string {
  if (!fulfillment) {
    return "No Type Set";
  }
  const option = options.find((opt) => opt.value === fulfillment);

  return option?.label || "";
}
