"use client";

import { useState } from "react";
import axios from "axios";
import { UserInfo } from "next-auth";
import { useRouter } from "next/navigation";
import {
  InitialFormDataNewStore,
  NewStoreFormData,
  ValidateFormDataNewStore,
} from "../utils";
import { toast } from "sonner";
import RenderStepNewStore from "./render-step-new-store";
import FooterNewStore from "./footer-new-store";
import ContainerNewStore from "./container-new-store";

export default function NewStoreClient({
  apiKey,
  user,
  startingStep,
}: {
  apiKey: string;
  user: UserInfo;
  startingStep: number;
}) {
  const router = useRouter();

  const [step, setStep] = useState(startingStep);
  const [formData, setFormData] = useState<NewStoreFormData>(
    InitialFormDataNewStore,
  );

  const updateFormData = <F extends keyof NewStoreFormData>(
    field: F,
    value: NewStoreFormData[F],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  console.log(
    formData,
    " in /Users/zachshort/web-ezh/features/new-store/main/new-store-client.tsx",
  );

  async function Submit() {
    const data = {
      userId: user.id,
      role: formData.role,
      name: "test name",
      address: formData.address,
      coordinates: formData.coordinates,
      type: formData.type,
      hours: formData.hours,
      bio: "test bio",
      isDefault: false,
    };

    console.log(
      data,
      " in /Users/zachshort/web-ezh/features/new-store/main/new-store-client.tsx",
    );

    try {
      const res = await axios.post("/api/locations", data);

      toast.success(res.data.message);
      router.push("/selling");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response.data.error);
    }
  }

  return (
    <>
      <ContainerNewStore step={step} formData={formData}>
        {RenderStepNewStore({
          formData: formData,
          updateFormData: updateFormData,
          step: step,
          setStep: setStep,
          apiKey: apiKey,
        })}
      </ContainerNewStore>
      <FooterNewStore
        formData={formData}
        updateFormData={updateFormData}
        step={step}
        setStep={setStep}
        canProceed={ValidateFormDataNewStore(formData, step)}
        isLastStep={step === 9}
        submit={Submit}
      />
    </>
  );
}
