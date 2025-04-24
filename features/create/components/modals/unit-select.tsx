"use client";

import Select from "react-select";
import useunits from "@/hooks/listing/use-unit";

export type unitValue = {
  value: string;
  label: string;
};

interface ProductSelectProps {
  selectedUnit?: unitValue; // Renamed from 'value'
  onUnitChange: (unit: unitValue | undefined) => void; // Renamed from 'onChange'
}

const UnitSelect: React.FC<ProductSelectProps> = ({
  selectedUnit,
  onUnitChange,
}) => {
  const { getAll } = useunits();

  return (
    <div className="relative peer">
      <Select
        placeholder="Unit"
        options={getAll()}
        value={selectedUnit}
        onChange={(newValue) => onUnitChange(newValue as unitValue)}
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
            borderColor: "black",
          }),
          singleValue: (base: any) => ({
            ...base,
            color: "black",
            fontWeight: "bold",
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
            neutral50: "black",
            neutral80: "black",
          },
        })}
        isClearable={true}
      />
    </div>
  );
};

export default UnitSelect;
