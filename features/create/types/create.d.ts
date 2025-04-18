import {
  FieldErrors,
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

export type category =
  | "unprocessed-produce"
  | "homemade"
  | "durables"
  | "dairy-meat"
  | "";
export type subcategory = string;
export type QuantityTypeValue = string | undefined;

export interface StepProps {
  step: number;
  category: category;
  setcategory: (category: category) => void;
  subcateory: subcategory;
  setsubcategory: (subcateory: subcategory) => void;
}

export interface CommonInputProps {
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  disabled: boolean;
}
export interface InputProps {
  id: string;
  label: string;
  type: string;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  disabled: boolean;
  formatPrice?: boolean;
  required?: boolean;
  maxlength?: number;
  step?: string;
}
