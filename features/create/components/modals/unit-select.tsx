"use client";

import { useState } from "react";
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-inherit relative">
      <Select
        placeholder=""
        options={getAll()}
        value={selectedUnit}
        onChange={(newValue) => onUnitChange(newValue as unitValue)}
        formatOptionLabel={(option: any) => (
          <div className="rounded-lg text-black font-extralight">
            {option.label}
          </div>
        )}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        classNames={{
          control: () => "p-3  shadow-sm rounded-[10px] border-[1px] peer",
          input: () => "text-lg font-extralight",
          option: () => "text-xs font-extralight",
          dropdownIndicator: () => "hidden",
        }}
        styles={{
          control: (base: any) => ({
            ...base,
            color: "black",
            borderColor: "#e5e5e5", // neutral-300 equivalent
            "&:hover": {
              borderColor: "black",
            },
          }),
          singleValue: (base: any) => ({
            ...base,
            color: "black",
            fontWeight: "normal",
            paddingLeft: "0",
          }),
          input: (base: any) => ({
            ...base,
            color: "black",
            fontWeight: "normal",
          }),
          option: (base: any) => ({
            ...base,
            color: "black",
            fontWeight: "normal",
          }),
          placeholder: (base: any) => ({
            ...base,
            color: "black",
          }),
          valueContainer: (base: any) => ({
            ...base,
            paddingLeft: "0",
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
        isClearable={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <label
        className={`
          absolute 
          duration-150 
          transform 
          ${selectedUnit || isFocused ? " -translate-y-0" : " translate-y-4"}
          top-1 
          z-5 
          origin-[0] 
          left-4
          text-black
          text-md
          font-normal
        `}
      >
        Unit
      </label>
    </div>
  );
};

export default UnitSelect;
