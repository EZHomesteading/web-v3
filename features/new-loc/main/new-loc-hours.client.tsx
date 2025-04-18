"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { UserInfo } from "next-auth";
import Toast from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { initialFormData, LocationFormData } from "../utils/utils";

export default function NewStoreClient({
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
    value: LocationFormData[F],
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
      <NewStoreHeader formData={formData} step={step} setStep={setStep} />
      <NewStoreContainer step={step} formData={formData}>
        {NewStoreRenderStep({
          step: step,
          setStep: setStep,
          formData: formData,
          updateFormData: updateFormData,
          apiKey: apiKey,
        })}
      </NewStoreContainer>
      <NewStoreFooter
        formData={formData}
        updateFormData={updateFormData}
        setStep={setStep}
        step={step}
        canProceed={NewStoreValidateForm(step, formData)}
        nextEnabled={nextEnabled}
        submit={Submit}
      />
    </>
  );
}
