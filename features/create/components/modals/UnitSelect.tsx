"use client";

import useUnits from "@/hooks/listing/use-unit";
import Select from "react-select";

export type unitValue = {
  unit: string;
  value: string;
};

interface ProductSelectProps {
  value?: unitValue;
  onChange: (value: unitValue) => void;
}

const UnitSelect: React.FC<ProductSelectProps> = ({ value, onChange }) => {
  const { getAll } = useUnits();

  return (
    <div className="relative peer">
      <Select
        placeholder="Unit"
        options={getAll()}
        value={value}
        onChange={(value: unitValue) => onChange(value as unitValue)}
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
      />
    </div>
  );
};

export default UnitSelect;
