"use client";

import Select from "react-select";
import useunits from "@/hooks/listing/use-unit";

export type unitValue = {
  unit: string;
  value: string;
  label?: string; // Add label to match react-select's expected format
};

interface ProductSelectProps {
  value?: unitValue;
  onChange: (value: unitValue | undefined) => void; // Allow undefined as input
}

const UnitSelect: React.FC<ProductSelectProps> = ({ value, onChange }) => {
  const { getAll } = useunits();

  return (
    <div className="relative peer">
      <Select
        placeholder="Unit"
        options={getAll()}
        value={value}
        onChange={(newValue) => onChange(newValue as unitValue)}
        formatOptionLabel={(option: any) => (
          <div className="rounded-lg text-black">{option.label}</div>
        )}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        classNames={{
          control: () => "py-3 pl-2 shadow-sm",
          input: () => "text-lg",
          option: () => "text-xs",
          dropdownIndicator: () => "hidden",
        }}
        styles={{
          control: (base: any) => ({
            ...base,
            color: "black",
          }),
          singleValue: (base: any) => ({
            ...base,
            color: "black",
          }),
          input: (base: any) => ({
            ...base,
            color: "black",
          }),
          option: (base: any) => ({
            ...base,
            color: "black",
          }),
          placeholder: (base: any) => ({
            ...base,
            color: "black",
          }),
        }}
        theme={(theme: any) => ({
          ...theme,
          borderRadius: 10,
          colors: {
            ...theme.colors,
            primary: "#000",
            primary25: "#f0f0f0",
            neutral50: "black", // This controls the placeholder text color
            neutral80: "black",
          },
        })}
        isClearable={true} // Allow clearing the selection
      />
    </div>
  );
};

export default UnitSelect;
