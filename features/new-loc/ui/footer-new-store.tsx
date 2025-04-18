import { Dispatch, SetStateAction } from "react";
import { NewStoreCoreProps } from "../utils/utils";
import ActionButtons from "./new-store-action-buttons";
import { OutfitFont } from "@/components/fonts";

interface FooterProps extends NewStoreCoreProps {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  canProceed: boolean;
  nextEnabled: boolean;
  submit: () => void;
}

export default function FooterNewStore({
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
          <ActionButtons
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
