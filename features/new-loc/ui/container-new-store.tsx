import { HTMLAttributes, ReactNode } from "react";
import { NewStoreFormData } from "../utils/utils";
import NewStoreHeader from "./new-store-header";

interface SectionLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  step: number;
  formData: NewStoreFormData;
}

export function ContainerNewStore({
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
        <NewStoreHeader step={step} formData={formData} />
      </div>
      {children}
    </div>
  );
}
