import { Dispatch, SetStateAction } from "react";
import { NewStoreCoreProps } from "../utils";

import InfoNewStoreStep from "../steps/step1.info";
import RoleNewStoreStep from "../steps/step2.role";
import LocationNewStoreStep from "../steps/step3.location";
import FulfillmentNewStoreStep from "../steps/step4.fulfillment";
import MonthsNewStoreStep from "../steps/step5.months";
import DaysNewStoreStep from "../steps/step6.days";
import HoursNewStoreStep from "../steps/step7.hours";
import ReviewNewStoreStep from "../steps/step8.review";
import FinishNewStoreStep from "../steps/step9.finish";

interface stepProps extends NewStoreCoreProps {
  step: number;
  apiKey: string;
  setStep: Dispatch<SetStateAction<number>>;
}
export default function RenderStepNewStore({
  step,
  formData,
  updateFormData,
  apiKey,
  setStep,
}: stepProps) {
  switch (step) {
    case 1:
      return <InfoNewStoreStep />;
    case 2:
      return (
        <RoleNewStoreStep formData={formData} updateFormData={updateFormData} />
      );
    case 3:
      return (
        <LocationNewStoreStep
          formData={formData}
          updateFormData={updateFormData}
          apiKey={apiKey}
        />
      );
    case 4:
      return (
        <FulfillmentNewStoreStep
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 5:
      return (
        <MonthsNewStoreStep
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 6:
      return (
        <DaysNewStoreStep
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
        <HoursNewStoreStep
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
        <ReviewNewStoreStep
          onFinish={() => { }}
          formData={formData}
          updateFormData={updateFormData}
          setStep={setStep}
        />
      );
    case 9:
      return (
        <FinishNewStoreStep
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    default:
      return null;
  }
}
