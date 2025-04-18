"use client";
import { useEffect, useState } from "react";
import { UserRole } from "types/user";
import { Address, Coordinates, Hours } from "types";
import * as NewLoc from "./index";
import axios from "axios";
import { UserInfo } from "next-auth";
import Toast from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export type LocationFormData = {
  name: string;
  type: string;
  coordinates: Coordinates;
  address: Address;
  hours: Hours;
  role: UserRole;
  fulfillmentStyle: NewLoc.FulfillmentType;
  selectedMonths: number[];
  selectedDays: string[];
  completedSteps: Array<"pickup" | "delivery">;
  currentConfig?: "pickup" | "delivery";
  bio: string;
};

const initialFormData: LocationFormData = {
  name: "",
  address: { street: "", state: "", city: "", zip: "" },
  coordinates: { lat: 0, lng: 0 },
  type: "Point",
  role: UserRole.CONSUMER,
  fulfillmentStyle: NewLoc.FulfillmentType.UNDECIDED,
  selectedMonths: [],
  selectedDays: [],
  hours: { delivery: [], pickup: [] },
  completedSteps: [],
  currentConfig: undefined,
  bio: "",
};

export default function NewLocHourClientV2({
  apiKey,
  user,
}: {
  apiKey: string;
  user: UserInfo;
}) {
  const [nextEnabled, setNextEnabled] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);
  const router = useRouter();
  console.log(formData.coordinates);

  const updateFormData = <F extends keyof LocationFormData>(
    field: F,
    value: LocationFormData[F]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (step <= 1) {
      setNextEnabled(false);
      const timer = setTimeout(() => {
        setNextEnabled(true);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setNextEnabled(true);
    }
  }, [step]);

  async function Submit() {
    const data = {
      userId: user.id,
      role: formData.role,
      name: formData.name,
      address: formData.address,
      coordinates: formData.coordinates,
      type: formData.type,
      hours: formData.hours,
      bio: formData.bio,
    };
    try {
      const res = await axios.post("/api/locations", { data: data });

      Toast({ message: res.data.message });
      router.push("/selling");
    } catch (error: any) {
      console.error(error);
      Toast({ message: error.response.data.error });
    }
  }

  return (
    <>
      <NewLoc.Header formData={formData} step={step} setStep={setStep} />
      <NewLoc.Container step={step} formData={formData}>
        {NewLoc.RenderStep({
          step: step,
          setStep: setStep,
          formData: formData,
          updateFormData: updateFormData,
          apiKey: apiKey,
        })}
      </NewLoc.Container>
      <NewLoc.Footer
        formData={formData}
        updateFormData={updateFormData}
        setStep={setStep}
        step={step}
        canProceed={NewLoc.ValidateForm(step, formData)}
        nextEnabled={nextEnabled}
        submit={Submit}
      />
    </>
  );
}
