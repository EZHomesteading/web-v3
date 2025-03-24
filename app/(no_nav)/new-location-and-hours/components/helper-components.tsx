import { Dispatch, HTMLAttributes, ReactNode, SetStateAction } from "react";
import { OutfitFont } from "@/components/fonts";
import { LocationFormData } from "./steps/v2.client";
import * as NewLoc from "./steps/index";
import { getStreet } from "../utils";
import { UserRole } from "@/types";

interface SectionLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  step: number;
  formData: LocationFormData;
}

export function Container({
  step,
  children,
  formData,
  ...rest
}: SectionLayoutProps) {
  return (
    <div
      {...rest}
      className={`overflow-y-auto flex flex-col items-center px-4 py-2`}
    >
      <div className="w-full max-w-md text-left mb-4">
        <HeaderContent step={step} formData={formData} />
      </div>
      {children}
    </div>
  );
}

function HeaderContent({
  step,
  formData,
}: {
  step: number;
  formData: LocationFormData;
}) {
  function getHeading() {
    switch (step) {
      case 2:
        return {
          title: "How would you like to sell your produce?",
          descriptions: [
            "If you have one Co-Op location, you can purchase from Growers",
          ],
        };
      case 3:
        return {
          title: "Where will you be selling from?",
          descriptions: [
            "Your location is approximate until a buyer purchases from you",
          ],
        };
      case 4:
        return {
          title: "Set Location Mode",
          descriptions: [
            "How would you like to fufill orders?",
            "Fine-tune your daily schedule later in settings",
          ],
        };
      case 5:
        return {
          title: "Select all months you plan to operate",
          descriptions: ["Select a month if you'll be open any day during it"],
        };
      case 6:
        return {
          title: "Select Days with the Same Hours",
          descriptions: [
            "You'll return here to set hours for additional days until your schedule is complete",
          ],
        };
      case 7:
        return {
          title: "Set Open & Close Hours for",
          descriptions: [
            `${formData?.selectedDays.join(", ")}`,
            "Fine-tune your daily schedule later in settings",
          ],
        };
      case 8:
        return {
          title: "Review Schedule",
          descriptions: [
            "You will be able to edit specific days later in settings",
          ],
        };
      case 9:
        return {
          title: "Congratulations!",
          descriptions: ["You've successfully added your first store & hours"],
        };
      default:
        return {
          title: "",
          descriptions: [],
        };
    }
  }

  const { title, descriptions } = getHeading();

  return (
    <>
      <div className={`${OutfitFont.className} text-2xl`}>{title}</div>
      {descriptions.map((description: string, index: number) => (
        <div
          key={index}
          className={`text-xs text-neutral-500 ${OutfitFont.className}`}
        >
          {description}
        </div>
      ))}
    </>
  );
}
interface FooterProps extends NewLocProps {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  canProceed: boolean;
  nextEnabled: boolean;
  submit: () => void;
}

export function Footer({
  step,
  setStep,
  formData,
  updateFormData,
  canProceed,
  nextEnabled,
  submit,
}: FooterProps) {
  const renderNextButton = () => {
    switch (step) {
      case 9:
        return (
          <button
            onClick={submit}
            disabled={!canProceed || !nextEnabled}
            className={`text-white bg-black px-4 py-2  rounded disabled:bg-gray-300`}
          >
            Create Store
          </button>
        );
      case 8:
        return (
          <NewLoc.ActionButtons
            fulfillmentStyle={formData.fulfillmentStyle}
            handleFinish={() => {
              setStep(9);
            }}
            handleFinishBoth={() => {
              setStep(9);
            }}
            savePickupSetDelivery={() => {
              // because hours is based on the selected months and dates
              // it was clearing out the state every time i tried to set delivery after pickup
              // so now i store it in a temp var to set it again after selected days and months gets cleared
              // create a temporary backup of the entire hours object
              // before resetting selections, so we don't lose state
              const tempHours = formData.hours;

              // back to step 5 for delivery configuration
              setStep(5);
              updateFormData("selectedDays", []);
              updateFormData("selectedMonths", []);
              updateFormData("currentConfig", "delivery");

              // IMPORTANT: immediately restore the hours object so pickup hours aren't lost
              // when the component re-renders
              setTimeout(() => {
                updateFormData("hours", tempHours);
              }, 0);
            }}
            completedSteps={formData.completedSteps}
          />
        );
      case 6:
        return null;
      case 7:
        return null;
      default:
        return (
          <button
            onClick={() => {
              setStep((prev) => Math.max(prev + 1));
            }}
            disabled={!canProceed}
            className={`px-4 py-2 text-base text-white bg-black rounded disabled:text-gray-300`}
          >
            Next
          </button>
        );
    }
  };
  return (
    <div
      className={`h-20 fixed bottom-0 zmax border-t w-full px-2 bg-white border-[#e4e4e7] ${OutfitFont.className}`}
    >
      <div className={`flex items-center flex-row h-full justify-between`}>
        <button
          onClick={() => {
            setStep((prev) => Math.max(1, prev - 1));
          }}
          className={`px-4 py-2 text-base underline text-black disabled:text-gray-300`}
        >
          Back
        </button>
        {renderNextButton()}
      </div>
    </div>
  );
}

interface p {
  setStep: Dispatch<SetStateAction<number>>;
  step: number;
  formData: LocationFormData;
}

export function Header({ formData, step, setStep }: p) {
  return (
    <div className={`relative h-12 w-full ${OutfitFont.className}`}>
      <div
        className={`relative border-b h-12 bg-white flex flex-row justify-evenly items-end z-10`}
        style={{ borderColor: "#e4e4e7" }}
      >
        <button
          onClick={() => {
            setStep(2);
          }}
          className={`text-sm`}
        >
          {getStreet(formData?.address?.street)}
        </button>
        <button
          onClick={() => {
            if (step > 4) {
              setStep(4);
            }
          }}
          className={`text-sm`}
        >
          {NewLoc.getFulfillmentText(formData?.fulfillmentStyle)}
        </button>
      </div>
    </div>
  );
}

export interface NewLocProps {
  formData: LocationFormData;
  updateFormData: <K extends keyof LocationFormData>(
    field: K,
    value: LocationFormData[K]
  ) => void;
}

interface stepProps extends NewLocProps {
  step: number;
  apiKey: string;
  setStep: Dispatch<SetStateAction<number>>;
}

export function RenderStep({
  step,
  formData,
  updateFormData,
  apiKey,
  setStep,
}: stepProps) {
  switch (step) {
    case 1:
      return <NewLoc.Info />;
    case 2:
      return (
        <NewLoc.Role formData={formData} updateFormData={updateFormData} />
      );
    case 3:
      return (
        <NewLoc.Address
          formData={formData}
          updateFormData={updateFormData}
          apiKey={apiKey}
        />
      );
    case 4:
      return (
        <NewLoc.Fulfillment
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 5:
      return (
        <NewLoc.Months formData={formData} updateFormData={updateFormData} />
      );
    case 6:
      return (
        <NewLoc.Days
          formData={formData}
          updateFormData={updateFormData}
          onComplete={(selectedDays: string[]) => {
            updateFormData("selectedDays", selectedDays);
            setStep(7);
          }}
          onCompleteHours={() => {
            setStep(8);
          }}
        />
      );
    case 7:
      return (
        <NewLoc.Hours
          onBack={() => {
            setStep(6);
          }}
          onComplete={() => {
            setStep(6);
            updateFormData("selectedDays", []);
          }}
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 8:
      return (
        <NewLoc.Review
          onFinish={() => {}}
          formData={formData}
          updateFormData={updateFormData}
          setStep={setStep}
        />
      );
    case 9:
      return (
        <NewLoc.Finish formData={formData} updateFormData={updateFormData} />
      );
    default:
      return null;
  }
}

export function ValidateForm(step: number, formData: LocationFormData) {
  if (step >= 2 && formData.role === UserRole.CONSUMER) {
    return false;
  }

  if (step >= 3 && !formData.address && !formData.coordinates) {
    return false;
  }

  if (step >= 4 && !formData.fulfillmentStyle) {
    return false;
  }

  if (step === 4 && !formData.selectedMonths) {
    return false;
  }

  return true;
}
interface ActionButtonsProps {
  fulfillmentStyle: NewLoc.FulfillmentType;
  handleFinish: () => void;
  handleFinishBoth: (type: "sameForBoth" | "delivery" | "pickup") => void;
  completedSteps?: Array<"pickup" | "delivery">;
  savePickupSetDelivery: () => void;
}

export function ActionButtons({
  fulfillmentStyle,
  handleFinish,
  handleFinishBoth,
  completedSteps = [],
  savePickupSetDelivery,
}: ActionButtonsProps) {
  const hasntCompletedDelivery =
    fulfillmentStyle === NewLoc.FulfillmentType.SEPARATE_HOURS &&
    completedSteps.length < 2;

  return (
    <>
      {fulfillmentStyle === NewLoc.FulfillmentType.SHARED_HOURS ? (
        <button
          onClick={() => handleFinishBoth("sameForBoth")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-green-800 fixed bottom-2 right-4 "
        >
          Save Hours for Both
        </button>
      ) : hasntCompletedDelivery ? (
        <button
          className="px-4 py-2 bg-black text-white rounded fixed bottom-2 right-4 "
          onClick={savePickupSetDelivery}
        >
          Set Delivery Hours
        </button>
      ) : (
        <button
          onClick={handleFinish}
          className="px-4 py-2 bg-black text-white rounded hover:bg-green-800 fixed bottom-2 right-4 "
        >
          Save Hours
        </button>
      )}
    </>
  );
}
