import { HTMLAttributes, ReactNode } from "react";
import HeaderNewStore from "./header-new-store";
import { NewStoreFormData } from "../utils";

interface SectionLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  step: number;
  formData: NewStoreFormData;
}

export default function ContainerNewStore({
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
        <HeaderNewStore step={step} formData={formData} />
      </div>
      {children}
    </div>
  );
}
