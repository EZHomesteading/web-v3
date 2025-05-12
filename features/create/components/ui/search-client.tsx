import React, { useCallback, useState, useEffect, useRef } from "react";
import AsyncSelect from "react-select/async";
import { FormattedProduct } from "../../hooks/use-product";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProductSelectProps {
  title: string;
  value: FormattedProduct | null;
  subcat: string;
  onChange: (value: FormattedProduct | null) => void;
  onCustomAction: (value: string) => void;
  customActionLabel: string;
  searchProducts: (query: string) => FormattedProduct[];
  getAll: () => FormattedProduct[];
  onCustomTitleSet: () => void;
  className?: string;
}

const SearchClient: React.FC<ProductSelectProps> = ({
  value,
  onChange,
  subcat,
  onCustomAction,
  customActionLabel,
  searchProducts,
  getAll,
  onCustomTitleSet,
  title,
  className,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<FormattedProduct | null>(
    value
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customTitleInput, setCustomTitleInput] = useState("");
  const selectRef = useRef<any>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  useEffect(() => {
    if (value) {
      setInputValue(value.label);
      setSelectedOption(value);
    } else {
      setInputValue("");
      setSelectedOption(null);
    }
  }, [value]);

  const customAction: FormattedProduct = {
    value: "custom-action",
    label: customActionLabel,
    cat: "",
    photo: "",
  };

  // Debug log utility
  // const addDebugLog = (message: string) => {
  //   setDebugLog((prev) => [...prev, message]);
  //   console.log(`[Debug] ${message}`);
  // };

  const loadOptions = useCallback(
    async (input: string) => {
      // addDebugLog(`Loading options for input: "${input}"`);
      let results: FormattedProduct[];

      if (input.trim() === "") {
        results = getAll().filter((product) => product.cat.includes(subcat));
        // addDebugLog(
        //   `Empty input, filtered results from getAll(): ${results.length}`
        // );
      } else {
        const searchResults = searchProducts(input);
        // addDebugLog(
        //   `Search returned ${searchResults.length} results for "${input}"`
        // );

        results = searchResults.filter((product) => {
          console.log(product.cat);
          return product.cat.includes(subcat);
        });
        //addDebugLog(`After subcat filter: ${results.length} results`);
      }

      // Ensure we have unique results by label
      const uniqueLabels = new Set();
      const uniqueResults = results.filter((product) => {
        if (!uniqueLabels.has(product.label)) {
          uniqueLabels.add(product.label);
          return true;
        }
        return false;
      });

      // Limit to 6 results for UI display
      const limitedResults = uniqueResults.slice(0, 6);

      // Always include the custom action option
      return [...limitedResults, customAction];
    },
    [searchProducts, getAll, subcat, customAction]
  );

  const handleChange = (newValue: FormattedProduct | null) => {
    if (newValue && newValue.value === "custom-action") {
      onCustomAction(inputValue);
    } else {
      setSelectedOption(newValue);
      onChange(newValue);
      setInputValue(newValue ? newValue.label : "");

      // Force unfocus
      setTimeout(() => {
        if (selectRef.current) {
          selectRef.current.blur();
        }
      }, 0);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();

      addDebugLog(`Key pressed: ${event.key} with input: "${inputValue}"`);

      loadOptions(inputValue).then((options) => {
        // Remove the custom action option for exact match checking
        const regularOptions = options.filter(
          (opt) => opt.value !== "custom-action"
        );

        const exactMatch = regularOptions.find(
          (option) => option.label.toLowerCase() === inputValue.toLowerCase()
        );

        addDebugLog(`Exact match found: ${Boolean(exactMatch)}`);

        if (!exactMatch && inputValue.trim() !== "") {
          setCustomTitleInput(inputValue);
          setIsModalOpen(true);
        } else if (exactMatch) {
          handleChange(exactMatch);
        }
      });
    }
  };

  const handleUseCustomTitle = () => {
    onCustomAction(customTitleInput);
    onCustomTitleSet && onCustomTitleSet();
    setIsModalOpen(false);
  };

  return (
    <>
      <AsyncSelect
        ref={selectRef}
        placeholder={"Title"}
        isClearable
        cacheOptions
        defaultOptions
        value={selectedOption}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        loadOptions={loadOptions}
        onKeyDown={handleKeyDown}
        formatOptionLabel={(option: FormattedProduct) => (
          <div className="flex flex-row items-center gap-3 zmax">
            <div>{option.label}</div>
          </div>
        )}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        classNames={{
          control: () => `h-[62px] p-2 shadow-sm text-black ${className}`,
          input: () => "text-base text-black",
          option: () => "text-xs hover:bg-gray-100 hover:cursor-pointer",
        }}
        theme={(theme) => ({
          ...theme,
          borderRadius: 5,
          colors: {
            ...theme.colors,
            primary: "#000",
            primary25: "#fff",
          },
        })}
      />
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Custom Title?</DialogTitle>
            <DialogDescription>
              "{customTitleInput}" does not match any existing options. Would
              you like to use it as a custom title?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseCustomTitle}>Use Custom Title</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchClient;
