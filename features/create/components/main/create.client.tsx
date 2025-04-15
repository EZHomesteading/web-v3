"use client";

import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { UserInfo } from "next-auth";
import { Button } from "@/components/ui/button";
import {
  Category,
  CommonInputProps,
  InputProps,
  SubCategory,
} from "@/features/create/types/create";
import { Progress } from "../../../../components/ui/progress";
import axios from "axios";
import { ReactNode, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QuantityTypeValue } from "../modals/unit-select";
import { addDays, format } from "date-fns";
import StepOne from "../steps/step1";
import StepTwo from "../steps/step2";
import StepThree from "../steps/step3";
import StepFour from "../steps/step4";
import StepFive from "../steps/step5";
import StepSix from "../steps/step6";
import { Location } from "@prisma/client";
import { OutfitFont } from "@/components/fonts";
import Help from "../modals/help";
import CreateHeader from "./header.create";
import Toast from "@/components/ui/toast";
import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";

interface Props {
  defaultLocation?: Location;
  locations: Location[];
  user?: UserInfo;
}

interface ImageState {
  isHovered: boolean;
  isFocused: boolean;
}

const CreateClient: React.FC<Props> = ({
  user,
  locations,
  defaultLocation,
}) => {
  const [rating, setRating] = useState<number[]>([]);
  const [certificationChecked, setCertificationChecked] =
    useState<boolean>(false);
  const [checkbox1Checked, setCheckbox1Checked] = useState<boolean>(false);
  const [checkbox2Checked, setCheckbox2Checked] = useState<boolean>(false);
  const [checkbox3Checked, setCheckbox3Checked] = useState<boolean>(false);
  const [checkbox4Checked, setCheckbox4Checked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [quantityType, setQuantityType] = useState<
    QuantityTypeValue | undefined
  >(undefined);
  const [category, setCategory] = useState<Category>("");
  const [subCategory, setSubCategory] = useState<SubCategory>("");
  const [projectHarvest, setProjectHarvest] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [review, setReview] = useState<boolean>(false);
  const [selectedLoc, setSelectedLoc] = useState<Location | undefined>(
    defaultLocation
  );
  const [imageSrc, setImageSrc] = useState<string[]>([]);
  const [imageStates, setImageStates] = useState<ImageState[]>(
    [...Array(3)].map(() => ({
      isHovered: false,
      isFocused: false,
    }))
  );
  const [postSODT, setPostSODT] = useState<boolean>(false);
  const [nonPerishable, setNonPerishable] = useState<boolean>(false);

  const router = useRouter();

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      sodt: user?.SODT,
      category: "",
      subCategory: "",
      locationId: defaultLocation?.id,
      locationRole: "",
      stock: "",
      projectedStock: "",
      quantityType: "",
      imageSrc: [],
      price: "",
      title: "",
      description: "",
      shelfLifeDays: 0,
      shelfLifeWeeks: 0,
      shelfLifeMonths: 0,
      shelfLifeYears: 0,
      rating: [],
      minOrder: "",
      harvestDates: [],
    },
  });

  const formLocationId = watch("locationId");
  const formLocationRole = watch("locationRole");
  const subcat = watch("subCategory");
  const formTitle = watch("title");
  const shelfLifeDays = watch("shelfLifeDays");
  const shelfLifeWeeks = watch("shelfLifeWeeks");
  const shelfLifeMonths = watch("shelfLifeMonths");
  const shelfLifeYears = watch("shelfLifeYears");
  const minOrder = watch("minOrder");
  const quantity = watch("stock");
  const price = watch("price");
  const sodt = watch("sodt");

  // Memoized input props
  const commonInputProps: CommonInputProps = useMemo(
    () => ({
      register,
      errors,
      watch,
      setValue,
      disabled: isLoading,
    }),
    [register, errors, watch, setValue, isLoading]
  );

  const inputProps: InputProps = useMemo(
    () => ({
      ...commonInputProps,
      id: "",
      label: "",
      type: "",
    }),
    [commonInputProps]
  );

  // Memoized shelfLife and expiryDate calculations
  const { shelfLife, expiryDate } = useMemo(() => {
    const sLife =
      parseInt(shelfLifeDays || "0", 10) +
      parseInt(shelfLifeWeeks || "0", 10) * 7 +
      parseInt(shelfLifeMonths || "0", 10) * 30 +
      parseInt(shelfLifeYears || "0", 10) * 365;

    let expDate = "";
    if (sLife) {
      const endDate = addDays(new Date(), sLife);
      expDate = format(endDate, "MMM d, yyyy");
    }

    return { shelfLife: sLife, expiryDate: expDate };
  }, [shelfLifeDays, shelfLifeWeeks, shelfLifeMonths, shelfLifeYears]);

  // Calculate progress
  const progress = useMemo(() => ((step - 1) / 7) * 100, [step]);

  // Button text and disabled state
  const buttonText = useMemo(() => (step === 7 ? "Finish" : "Next"), [step]);
  const showBackButton = useMemo(() => step > 2, [step]);

  const nextButtonDisabled = useCallback((): boolean => {
    if (step === 1 && !selectedLoc) {
      return true;
    }
    if (step === 2 && (!category || !subCategory)) {
      return true;
    }
    if (step === 3 && (!title || !description)) {
      return true;
    }
    return false;
  }, [step, selectedLoc, category, subCategory, title, description]);

  // Memoized callback functions
  const setCustomValue = useCallback(
    (id: string, value: any): void => {
      setValue(id, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue]
  );

  const handleCustomTitleSet = useCallback((): void => {
    setImageSrc([]);
    setValue("imageSrc", []);
  }, [setValue]);

  const handleCheckboxChange = useCallback(
    (checked: boolean, index: number): void => {
      setRating((prevRating) => {
        let newRating = [...prevRating];
        if (checked) {
          if (!newRating.includes(index + 1)) {
            newRating.push(index + 1);
          }
        } else {
          newRating = newRating.filter((value) => value !== index + 1);
        }
        return newRating.sort((a, b) => a - b);
      });

      switch (index) {
        case 0:
          setCheckbox1Checked(checked);
          break;
        case 1:
          setCheckbox2Checked(checked);
          break;
        case 2:
          setCheckbox3Checked(checked);
          break;
        case 3:
          setCheckbox4Checked(checked);
          break;
        default:
          break;
      }
    },
    []
  );

  const handleCertificationCheckboxChange = useCallback(
    (checked: boolean): void => {
      setCertificationChecked(checked);
      setRating((prevRating) => {
        if (checked) {
          if (!prevRating.includes(0)) {
            return [0, ...prevRating];
          }
        } else {
          return prevRating.filter((value) => value !== 0);
        }
        return prevRating;
      });
    },
    []
  );

  const handleProjectHarvestCheckboxChange = useCallback(
    (checked: boolean): void => {
      setProjectHarvest(checked);
      if (!checked) {
        setValue("projectedStock", watch("stock") || "");
        setValue("stock", "0");
      } else {
        setValue("stock", watch("projectedStock") || "");
        setValue("projectedStock", "");
        setValue("harvestDates", []);
      }
    },
    [setValue, watch]
  );

  const handleSODTCheckboxChange = useCallback(
    (checked: boolean, index: number): void => {
      if (index === 0) {
        setPostSODT(checked);
        postNewSODT(checked);
      }
    },
    []
  );

  const handleNonPerishableCheckboxChange = useCallback(
    (checked: boolean, index: number): void => {
      if (index === 0) {
        setNonPerishable(checked);
        if (checked === true) {
          setCustomValue("shelfLifeYears", 1000);
        } else {
          setCustomValue("shelfLifeYears", 0);
        }
      }
    },
    [setCustomValue]
  );

  const handleMouseEnter = useCallback((index: number): void => {
    setImageStates((prevStates) =>
      prevStates.map((state, i) =>
        i === index ? { ...state, isHovered: true } : state
      )
    );
  }, []);

  const handleMouseLeave = useCallback((index: number): void => {
    setImageStates((prevStates) =>
      prevStates.map((state, i) =>
        i === index ? { ...state, isHovered: false } : state
      )
    );
  }, []);

  const handleClick = useCallback((index: number): void => {
    setImageStates((prevStates) =>
      prevStates.map((state, i) =>
        i === index ? { ...state, isFocused: !state.isFocused } : state
      )
    );
  }, []);

  const postNewSODT = useCallback(
    async (checked: boolean): Promise<void> => {
      const locationId = watch("locationId");
      try {
        if (checked) {
          await axios.post("api/location/update", {
            locationId: locationId,
            SODT: sodt !== null ? parseInt(sodt) : null,
          });
        } else {
          await axios.post("api/location/update", {
            locationId: locationId,
            SODT: null,
          });
        }
      } catch (error) {
        console.error("Error posting SODT:", error);
      }
    },
    [watch, sodt]
  );

  const showError = useCallback(
    (message: string, details?: ReactNode): void => {
      Toast({ message: message, position: "bottom-center", details: details });
    },
    []
  );

  const checkField = useCallback(
    (
      condition: boolean | undefined,
      errorMessage: string,
      errorDetails?: ReactNode
    ): boolean => {
      if (condition) {
        showError(errorMessage, errorDetails);
        return true;
      }
      return false;
    },
    [showError]
  );

  const filterAndAppendWords = useCallback((inputString: string): string[] => {
    // List of common words to filter out
    const commonWords = new Set([
      "a",
      "an",
      "and",
      "are",
      "as",
      "at",
      "be",
      "by",
      "for",
      "from",
      "has",
      "he",
      "in",
      "is",
      "it",
      "its",
      "of",
      "on",
      "that",
      "the",
      "to",
      "was",
      "were",
      "will",
      "with",
      "this",
      "these",
      "those",
      "they",
      "my",
      "i",
      "have",
      "then",
      "there",
      "desc",
      "description",
      "product",
      "ass",
      "bitch",
      "cunt",
      "whore",
      "fuck",
      "fuckin",
      "fucking",
      " ",
    ]);
    // Convert the input string to lowercase and split it into words
    const words = inputString.toLowerCase().match(/\b\w+\b/g) || [];

    // Filter out common words and append remaining words to the result array
    return words.filter((word) => !commonWords.has(word));
  }, []);

  const removeDuplicates = useCallback(<T,>(arr: T[]): T[] => {
    return [...new Set(arr)];
  }, []);

  const buildKeyWords = useCallback(
    (desc: string): void => {
      const keywordarr = filterAndAppendWords(desc);
      const noDupeKeywordArr = removeDuplicates(keywordarr);
      setTags(noDupeKeywordArr);
    },
    [filterAndAppendWords, removeDuplicates]
  );

  const handlePrevious = useCallback((): void => {
    setStep(step - 1);
  }, [step]);

  const onSubmit: SubmitHandler<FieldValues> = useCallback(
    async (data: FieldValues): Promise<void> => {
      setIsLoading(true);
      const formattedPrice = parseFloat(parseFloat(data.price).toFixed(2));
      const shelfLife =
        parseInt(data.shelfLifeDays || "0", 10) +
        parseInt(data.shelfLifeWeeks || "0", 10) * 7 +
        parseInt(data.shelfLifeMonths || "0", 10) * 30 +
        parseInt(data.shelfLifeYears || "0", 10) * 365;

      const formData = {
        keyWords: tags,
        title: title,
        SODT: parseInt(data.sodt),
        description: description,
        imageSrc: imageSrc,
        category: category,
        quantityType:
          data.quantityType === "none" || data.quantityType === "each"
            ? ""
            : data.quantityType,
        stock: projectHarvest === false ? 0 : parseInt(data.stock, 10),
        shelfLife: shelfLife,
        minOrder: parseInt(data.minOrder),
        harvestDates: projectHarvest === false ? data.harvestDates : [],
        projectedStock:
          projectHarvest === false ? parseInt(data.projectedStock) : null,
        harvestFeatures: projectHarvest === false ? true : null,
        price: formattedPrice,
        subCategory: subCategory,
        rating: rating,
        review: review === true ? true : null,
        reports: review === true ? 1 : null,
        locationId: data.locationId,
      };

      if (!formData.locationId) {
        Toast({ message: "You must set a location before creating a listing" });
        setStep(1);
        return;
      }

      try {
        await axios.post("/api/listing/listings", formData);

        [
          "category",
          "subCategory",
          "locationId",
          "locationRole",
          "stock",
          "quantityType",
          "imageSrc",
          "price",
          "title",
          "description",
          "shelfLifeDays",
          "shelfLifeWeeks",
          "shelfLifeMonths",
          "shelfLifeYears",
          "projectedStock",
          "harvestDates",
          "sodt",
          "rating",
          "minOrder",
        ].forEach((field) =>
          setValue(
            field,
            field === "rating"
              ? []
              : field === "minOrder"
              ? 1
              : field === "sodt"
              ? 60
              : ""
          )
        );

        setRating([]);
        setTags([]);
        setCertificationChecked(false);
        setQuantityType(undefined);

        router.push("/selling/my-store");

        Toast({ message: "Listing created successfully!" });
      } catch (error) {
        console.error("Error in the overall process:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
        }
        Toast({
          message:
            "An error occurred while creating the listing. Please try again or contact support.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      tags,
      title,
      description,
      imageSrc,
      category,
      subCategory,
      projectHarvest,
      rating,
      review,
      setValue,
      router,
    ]
  );

  const handleNext = useCallback(async (): Promise<void> => {
    const errors = {
      1: [
        {
          condition: () => !formLocationId || formLocationId.length !== 24,
          message: "Please set a location",
        },
      ],
      2: [
        { condition: () => category === "", message: "Set a category!" },
        { condition: () => subCategory === "", message: "Set a Subcategory!" },
      ],
      3: [
        {
          condition: () => title === "",
          message: "Let us know what produce you have!",
        },
        {
          condition: () => !description,
          message: "Please write a brief description",
        },
      ],
      4: [
        {
          condition: () => !quantityType,
          message: "Please enter a unit for your listing",
        },
        {
          condition: () =>
            projectHarvest === true &&
            parseInt(minOrder || "0") > parseInt(quantity || "0"),
          message: "Minimum order cannot be more than your quantity",
        },
        {
          condition: () => !sodt,
          message: "Please enter a set out/delivery time for your listing",
        },
        {
          condition: () =>
            parseInt(quantity || "0") <= 0 ||
            (projectHarvest === true && !quantity),
          message: "Quantity must be greater than 0",
        },
        {
          condition: () => parseFloat(price || "0") <= 0 || !price,
          message: "Please enter a price greater than 0",
        },
        {
          condition: () =>
            parseInt(minOrder || "0") <= 0 ||
            (projectHarvest === true && !quantity),
          message: "Please enter a minimum order greater than 0",
        },
      ],
      5: [
        {
          condition: () =>
            parseInt(shelfLifeDays || "0") <= 0 &&
            parseInt(shelfLifeWeeks || "0") <= 0 &&
            parseInt(shelfLifeMonths || "0") <= 0 &&
            parseInt(shelfLifeYears || "0") <= 0,
          message: "Shelf life must be at least 1 day",
        },
      ],
      6: [
        {
          condition: () => !certificationChecked,
          message: "You must certify that the above information is accurate.",
        },
      ],
      7: [
        {
          condition: () => Array.isArray(imageSrc) && imageSrc.length === 0,
          message: "Please upload at least one photo",
        },
      ],
    };

    const currentErrors = errors[step as keyof typeof errors] || [];
    for (const error of currentErrors) {
      if (checkField(error.condition(), error.message)) return;
    }

    if (step === 7 || (step === 6 && locations === null)) {
      handleSubmit(onSubmit)();
    } else {
      setStep(step + 1);
    }
  }, [
    step,
    formLocationId,
    category,
    subCategory,
    title,
    description,
    quantityType,
    projectHarvest,
    minOrder,
    quantity,
    sodt,
    price,
    shelfLifeDays,
    shelfLifeWeeks,
    shelfLifeMonths,
    shelfLifeYears,
    certificationChecked,
    imageSrc,
    locations,
    checkField,
    handleSubmit,
    onSubmit,
  ]);

  // Effects
  useEffect(() => {
    // Cleanup function for when component unmounts
    return () => {
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    setPostSODT(false);
    return () => {
      // Cleanup if needed
    };
  }, [sodt]);

  useEffect(() => {
    setNonPerishable(false);
    return () => {
      // Cleanup if needed
    };
  }, [sodt]);

  useEffect(() => {
    if (parseInt(quantity || "0") <= 0) {
      setValue("stock", "1");
    }
    if (parseInt(minOrder || "0") <= 0) {
      setValue("minOrder", "1");
    }

    return () => {
      // Cleanup if needed
    };
  }, [quantity, minOrder, setValue]);

  useEffect(() => {
    if (defaultLocation) {
      setValue("locationId", defaultLocation.id);
      setValue("locationRole", defaultLocation.role);
      setSelectedLoc(defaultLocation);
      setStep(2);
    }

    return () => {
      // Cleanup if needed
    };
  }, [defaultLocation, setValue]);

  return (
    <div
      className={`mt-16 h-full min-h-[calc(100vh-4rem)] overflow-y-auto ${OutfitFont.className}`}
    >
      {/* header */}
      <div className="w-full fixed top-0 left-0 zmid">
        <Progress value={progress} className="w-full h-[6px] bg-gray-200" />
        {step > 0 && (
          <CreateHeader setStep={setStep} street={selectedLoc?.address[0]} />
        )}
      </div>
      {/* content container */}
      <div className={``}>
        {step === 1 && (
          <div className="fade-in flex flex-col items-center w-full">
            {locations && locations.length >= 1 ? (
              <>
                <div className={` text-center max-w-sm w-full pb-2`}>
                  <p className={`font-semibold text-lg`}>
                    Set a Selling Location
                  </p>
                  <p className={`font-medium text-sm text-gray-600`}>
                    Where are you selling this listing from?
                  </p>
                </div>
                <section className={`flex flex-col gap-y-3 w-full max-w-sm`}>
                  {locations.map((location: Location) => (
                    <button
                      className={`w-full border !border-k relative py-8 rounded-sm shadow-md ${
                        formLocationId === location?.id && "bg-black text-white"
                      }`}
                      onClick={() => {
                        setValue("locationId", location?.id);
                        setValue("locationRole", location.role);
                        setSelectedLoc(location);
                      }}
                      key={location?.id}
                    >
                      {location?.displayName ? (
                        <div>
                          <p className={`text-base font-medium `}>
                            {location?.displayName}
                          </p>
                          <p className={`text-xs text-neutral-700 font-medium`}>
                            {location?.address[0]}
                          </p>
                        </div>
                      ) : (
                        <p className={`text-base font-medium `}>
                          {location?.address[0]}
                        </p>
                      )}
                    </button>
                  ))}
                  {locations?.length < 5 && (
                    <Link
                      href={`/new-location-and-hours`}
                      className={`text-gray-500 w-full border !border-k relative py-8 rounded-sm shadow-md text-base font-medium text-center
                    `}
                    >
                      Create New Selling Location
                    </Link>
                  )}
                </section>
              </>
            ) : (
              <div>
                <p className={` max-w-sm text-center text-sm`}>
                  You have no elidgable selling locations. This occurs when you
                  have no locations that are marked for selling or no locations
                  in general. Creating a selling location is free and takes only
                  a couple of minutes.
                </p>
                <Link
                  href={`/new-location-and-hours`}
                  className={`items-center border p-4 shadow-md text-base sm:text-xl group font-medium rounded-full flex justify-between !border-black absolute top-1/3 right-1/2 transform translate-x-1/2 w-full max-w-[350px]`}
                >
                  Create a new Selling Location
                  <PiArrowRight
                    className={`text-xl ml-3 hover:translate-x-3  duration-300 group-hover:translate-x-2`}
                  />
                </Link>
                <Link
                  href={`/`}
                  className={`absolute top-[43%] right-1/2 transform translate-x-1/2 underline`}
                >
                  Home
                </Link>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <StepOne
            handlePrevious={handlePrevious}
            step={step}
            subCategory={subCategory}
            setSubCategory={setSubCategory}
            category={category}
            setCategory={setCategory}
          />
        )}
        {step === 3 && (
          <StepTwo
            setReview={setReview}
            title={title}
            setValue={setValue}
            setTitle={setTitle}
            setImageSrc={setImageSrc}
            description={description}
            setDescription={setDescription}
            tag={tag}
            setTag={setTag}
            tags={tags}
            setTags={setTags}
            buildKeyWords={buildKeyWords}
            isLoading={isLoading}
            subcat={subCategory}
            onCustomTitleSet={handleCustomTitleSet}
          />
        )}
        {step === 4 && (
          <StepThree
            role={formLocationRole}
            title={formTitle}
            quantityType={quantityType}
            setQuantityType={setQuantityType}
            postSODT={postSODT}
            handleSODTCheckboxChange={handleSODTCheckboxChange}
            usersodt={user?.SODT ?? null}
            commonInputProps={commonInputProps}
            inputProps={inputProps}
            projectHarvest={projectHarvest}
            handleProjectHarvestCheckboxChange={
              handleProjectHarvestCheckboxChange
            }
            setValue={setValue}
          />
        )}
        {step === 5 && (
          <StepFour
            nonPerishable={nonPerishable}
            handleNonPerishableCheckboxChange={
              handleNonPerishableCheckboxChange
            }
            shelfLifeDays={shelfLifeDays}
            shelfLifeWeeks={shelfLifeWeeks}
            shelfLifeMonths={shelfLifeMonths}
            shelfLifeYears={shelfLifeYears}
            setCustomValue={setCustomValue}
            expiryDate={expiryDate}
          />
        )}
        {step === 6 && (
          <StepFive
            checkbox1Checked={checkbox1Checked}
            checkbox2Checked={checkbox2Checked}
            checkbox3Checked={checkbox3Checked}
            checkbox4Checked={checkbox4Checked}
            certificationChecked={certificationChecked}
            handleCheckboxChange={handleCheckboxChange}
            handleCertificationCheckboxChange={
              handleCertificationCheckboxChange
            }
          />
        )}
        {step === 7 && (
          <StepSix
            imageSrc={imageSrc}
            setImageSrc={setImageSrc}
            imageStates={imageStates}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            handleClick={handleClick}
          />
        )}
      </div>
      {/* footer */}
      {showBackButton && (
        <Button
          onClick={handlePrevious}
          className="fixed bottom-6 left-5 text-xl hover:cursor-pointer"
        >
          Back
        </Button>
      )}

      <Button
        onClick={handleNext}
        className={`fixed bottom-6 right-5 text-xl hover:cursor-pointer`}
        disabled={nextButtonDisabled()}
      >
        {buttonText}
      </Button>
      <Help step={step} role={user?.role} />
    </div>
  );
};

export default CreateClient;
