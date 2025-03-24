"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { UserInfo } from "next-auth";
import { Address, Coordinates, Hours, LocationObj, UserRole } from "@/types";
import Toast from "@/components/ui/toast";
import { toast } from "sonner";
import OnboardHeader from "./header.onboard";
import StepOne from "./steps/1.info";
import StepTwo from "./steps/2.role";
import StepThree from "./steps/3.address";
import StepSeven from "./steps/7.hours";
import StepEight from "./steps/8.review";
import StepNine from "./steps/9.finish";
import { HoverButton } from "@/components/ui/hover-btn";
import { OutfitFont } from "@/components/fonts";
import StepSix from "./steps/6.days";

interface Props {
  user: UserInfo;
  index: number;
  apiKey: string;
  locations: Location[] | null;
}

export type LocationFormData = {
  locationId?: string;
  name?: string;
  role: UserRole;
  image?: string;
  bio?: string;
  fulfillmentStyle?: string;
  type: string;
  coordinates?: Coordinates;
  address?: Address;
  isDefault?: boolean;
  hours?: Hours;
  selectedMonths?: number[];
};

const initialFormData: LocationFormData = {
  role: UserRole.CONSUMER,
  type: "Point",
};

const NewLocHoursClient = ({
  user: initialUser,
  index,
  apiKey,
  locations,
}: Props) => {
  const router = useRouter();
  const [step, setStep] = useState(locations?.length !== 0 ? 2 : index);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [prevSelectedDays, setPrevSelectedDays] = useState<string[]>([]);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [prevHours, setPrevHours] = useState<any>();
  const [user, setUser] = useState<UserInfo>(initialUser);
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);
  const [progress, setProgress] = useState(0);
  const updateFormData = <F extends keyof LocationFormData>(
    field: F,
    value: LocationFormData[F]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateFormDataMonths = useCallback(
    (newData: Partial<{ selectedMonths: number[] }>) => {
      setFormData((prevData) => {
        if (
          newData.selectedMonths &&
          JSON.stringify(prevData.selectedMonths) ===
            JSON.stringify(newData.selectedMonths)
        ) {
          return prevData;
        }
        return {
          ...prevData,
          ...newData,
        };
      });
    },
    []
  );

  const handleNext = async () => {
    try {
      if (step === 3 && !formData.locationId) {
        if (locations && locations?.length > 3) {
          Toast({
            message:
              "You already have the maximum number of locations. Sending you to Add a Product page.",
          });
          router.push("/create");
          return;
        }
        if (formData) {
          const response = await axios.post(
            "/api/useractions/update/location-hours",
            {
              formData,
            }
          );

          updateFormData("locationId", response.data.locationId);
        }
      } else if (step === 7 && formData.locationId) {
        if (formData?.hours) {
          setUser((prevUser: any) => ({
            ...prevUser,
          }));
        }
        setStep((prevStep) => prevStep - 1);
        return;
      }
      setStep((prevStep) => prevStep + 1);
      setProgress((prevProgress) => prevProgress + 14.28);
    } catch (error) {
      console.error(`Error updating data for step ${step}:`, error);
      toast.error("An error occurred while saving your data.");
    }
  };

  const handlePrevious = () => {
    if (step === 8) {
      setStep(6);
      return;
    }
    if (step === 7) {
      handleStep7Back();
    }
    setStep((prevStep) => prevStep - 1);
    setProgress((prevProgress) => prevProgress - 14.28);
  };
  const handleStep6Complete = (days: string[]) => {
    setSelectedDays([]);
    setSelectedDays(days);
    setPrevSelectedDays((prevdays) => {
      return [...prevdays, ...days];
    });
    setIsEdit(false);
    setStep(7);
  };
  const handleStep8Change = (days: string[]) => {
    setSelectedDays(days);
    setIsEdit(true);
    setStep(7);
  };
  const handleCompleteHours = () => {
    setStep(8);
  };
  const handleStep7Back = () => {
    console.log(selectedDays);
    setPrevSelectedDays((prevDays) => {
      return prevDays.filter((day) => !selectedDays.includes(day));
    });
    setSelectedDays([]);
  };

  const handleStep7Complete = () => {
    if (isEdit === true) {
      setStep(8);
    } else {
      setSelectedDays([]);
      setStep(6);
    }
  };

  const resetHoursData = async (
    hours: Hours,
    newType: "both" | "delivery" | "pickup"
  ) => {
    try {
      const response = await axios.post(
        "/api/useractions/update/location-hours",
        {
          location: [
            {
              address: formData?.address,
              coordinates: formData?.coordinates,
              role: formData.role,
              hours: hours,
            },
          ],
          locationId: formData.locationId,
          isDefault: null,
        }
      );

      if (response.data) {
        Toast({ message: "Location hours updated successfully!" });
        setSelectedDays([]);
        setPrevSelectedDays([]);
        setIsEdit(false);
        setStep(5);
      } else {
        Toast({
          message: "Failed to update location hours. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating location hours:", error);
      toast.error("An error occurred while saving your data.");
    }
  };

  const handleFinish = async (newHours: Hours, type: string) => {
    try {
      let updatedHours: Hours;

      if (type === "both") {
        updatedHours = {
          delivery: [...(newHours.delivery || [])],
          pickup: [...(newHours.pickup || [])],
        };
      } else {
        updatedHours = {
          delivery:
            type === "delivery"
              ? [...(newHours.delivery || [])]
              : [...(prevHours?.delivery || [])],
          pickup:
            type === "pickup"
              ? [...(newHours.pickup || [])]
              : [...(prevHours?.pickup || [])],
        };
      }

      const response = await axios.post(
        "/api/useractions/update/location-hours",
        {
          location: [
            {
              address: formData?.address,
              coordinates: formData?.coordinates,
              role: formData.role,
              hours: updatedHours,
            },
          ],
          locationId: formData.locationId,
          isDefault: null,
        }
      );

      if (response.data) {
        toast.success("Location hours updated successfully!");
        setStep(9);
      } else {
        toast.error("Failed to update location hours. Please try again.");
      }
    } catch (error) {
      console.error("Error updating location hours:", error);
      toast.error("An error occurred while saving your data.");
    }
  };
  useEffect(() => {
    setProgress(step * 14.28); // 100 / 7 steps
  }, [step]);
  const shouldShowNextButton = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!formData.role;
      case 3:
        return !!(formData?.address && formData?.coordinates);
      case 4:
        return !!formData.fulfillmentStyle;
      case 5:
        return formData.selectedMonths && formData.selectedMonths.length >= 1;
      default:
        return false;
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen overflow-y-auto">
        {/* header */}
        <div className="w-full fixed top-0 left-0 zmax">
          <Progress value={progress} className="w-full h-[6px] bg-gray-200" />
          {step > 0 && (
            <OnboardHeader
              street={formData?.address?.street}
              fulfillmentStyle={formData?.fulfillmentStyle}
            />
          )}
        </div>
        {/* main  */}
        <div className={`flex-grow py-[4.5rem]`}>
          {step === 1 && <StepOne />}
          {step === 2 && (
            <StepTwo formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <StepThree
              apiKey={apiKey}
              numLocs={locations?.length}
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {step === 4 && (
            <StepFour
              user={user}
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {step === 5 && (
            <StepFive
              user={user}
              formData={formData}
              updateFormData={updateFormDataMonths}
            />
          )}
          {step === 6 && (
            <StepSix
              onComplete={handleStep6Complete}
              onCompleteHours={handleCompleteHours}
              selectedDays={selectedDays}
              setSelectedDays={setSelectedDays}
              prevSelectedDays={prevSelectedDays}
            />
          )}
          {step === 7 && (
            <StepSeven
              user={user}
              updateFormData={updateFormData}
              formData={formData}
              selectedDays={selectedDays}
              onComplete={handleStep7Complete}
              onBack={handleStep7Back}
              fulfillmentStyle={formData?.fulfillmentStyle}
            />
          )}
          {step === 8 && (
            <StepEight
              formData={formData}
              updateFormData={updateFormDataMonths}
              onDayChange={handleStep8Change}
              onFinish={handleFinish}
              resetHoursData={resetHoursData}
            />
          )}
          {step === 9 && (
            <StepNine
              formData={formData}
              updateFormData={updateFormDataMonths}
            />
          )}
        </div>
        {/* footer */}
        <div
          className={`fixed bottom-0 left-0 w-full bg-white lg:bg-transparent border-t lg:border-none z`}
        >
          <div
            className={`flex justify-between px-4 py-2 ${OutfitFont.className} `}
          >
            {step > 1 && step < 9 && (
              <Button onClick={handlePrevious} variant="outline">
                Back
              </Button>
            )}
            {step === 1 && (
              <div className="flex">
                <div onClick={() => router.push("/create")}>
                  <HoverButton
                    buttonText="Skip for now"
                    hoverMessage="If you skip these steps users will not be able to purchase products from you."
                  />
                </div>
                <div className="ml-4">
                  <Button onClick={() => router.push("/")}>Go Home</Button>
                </div>
              </div>
            )}
            {step < 6 && shouldShowNextButton() && (
              <Button onClick={handleNext}>Next</Button>
            )}{" "}
          </div>
        </div>
      </div>
    </>
  );
};

export default NewLocHoursClient;
