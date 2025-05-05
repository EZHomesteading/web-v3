import { PiStorefrontThin } from "react-icons/pi";
import { OutfitFont } from "@/components/fonts";
import { UserRole } from "@/types";
import { NewStoreCoreProps } from "../utils";

export default function RoleNewStoreStep({
  formData,
  updateFormData,
}: NewStoreCoreProps) {
  console.log(
    formData.role,
    "role in /Users/zachshort/web-ezh/features/new-store/steps/step2.role.tsx"
  );
  const options = [
    {
      label: "Co-Op Location",
      value: UserRole.COOP,
      icon: <PiStorefrontThin size={24} />,
      description: [
        "Sell directly to anyone",
        "Recommended for market stand owners looking to expand by sourcing goods from producers and reselling",
        "Greater time commitment but greater rewards",
        "Co-ops traditionally handle orders on-site",
      ],
      bg: "bg-[#ADD8E6]/20 !border-[#ADD8E6]",
    },
    {
      label: "Grower Location",
      value: UserRole.PRODUCER,
      icon: <PiStorefrontThin size={24} />,
      description: [
        "Sell Only to Co-Ops",
        "Recommended for people looking to sell excess produce at discounted rates.",
        "Producers typically deliver their bulk goods to Co-Ops",
        "Less time commitment",
      ],
      bg: "bg-[#ced9bb]/20 !border-[#ced9bb]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-[15%]">
      {options.map((option) => (
        <button
          key={option.label}
          onClick={() => {
            updateFormData("role", option.value);
          }}
          className={`${
            OutfitFont.className
          } rounded-xl text-black p-6 text-start w-full border max-w-96 ${
            formData.role === option.value && option.bg
          }`}
        >
          <div className="flex items-center space-x-2">
            {option.icon}
            <span className="text-md sm:text-lg font-semibold">
              {option.label}
            </span>
          </div>
          {option.description.map((line, idx) => (
            <p key={idx} className={`text-xs py-[2px] text-neutral-500`}>
              {line}
            </p>
          ))}
        </button>
      ))}
    </div>
  );
}
