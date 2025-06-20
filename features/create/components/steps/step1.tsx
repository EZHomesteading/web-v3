"use client";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  GiAppleCore,
  GiCandyCanes,
  GiJellyBeans,
  GiOlive,
  GiRopeCoil,
  GiShinyApple,
  GiWheat,
} from "react-icons/gi";
import { LuBeef } from "react-icons/lu";
import { CiApple, CiHome } from "react-icons/ci";
import { Button } from "@/components/ui/button";
import {
  GiCarrot,
  GiCoconuts,
  GiHerbsBundle,
  GiWoodCabin,
  GiCupcake,
  GiHoneypot,
  GiSlicedBread,
  GiWaterBottle,
  GiCampfire,
  GiCookingPot,
  GiMilkCarton,
  GiLeg,
  GiChickenOven,
  GiCow,
  GiPig,
  GiFishCorpse,
  GiButterToast,
} from "react-icons/gi";
import { FaTools } from "react-icons/fa";
import { IoFastFoodOutline } from "react-icons/io5";
import { category } from "../../types/create";
import { useEffect } from "react";
// import NotSureModal from "../notSureModal";
export type Category =
  | "unprocessed-produce"
  | "homemade"
  | "durables"
  | "dairy-meat"
  | "";
type subcategory = string;

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

interface SubCategoryCardProps {
  title: string;
  isSelected: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

interface CategorySelectionProps {
  category: Category;
  setcategory: (category: Category) => void;
  onGoBack: () => void;
}

interface SubCategorySelectionProps {
  category: category;
  subcategory: subcategory;
  setsubcategory: (subcateory: subcategory) => void;
  onGoBack: () => void;
  handleNext: () => void;
}
const subcategoryIcons: Record<string, React.ReactNode> = {
  fruit: <GiShinyApple size={30} />,
  vegetables: <GiCarrot size={30} />,
  nuts: <GiCoconuts size={30} />,
  herbs: <GiHerbsBundle size={30} />,
  grains: <GiWheat size={30} />,
  legumes: <GiJellyBeans size={30} />,
  crafts: <GiWoodCabin size={30} />,
  "baked-goods": <GiCupcake size={30} />,
  jams: <GiHoneypot size={30} />,
  breads: <GiSlicedBread size={30} />,
  pasta: <GiCookingPot size={30} />,
  oils: <GiOlive size={30} />,
  candy: <GiCandyCanes size={30} />,
  "canned-goods": <GiWaterBottle size={30} />,
  tools: <FaTools size={30} />,
  survival: <GiCampfire size={30} />,
  "kitchen-wares": <GiCookingPot size={30} />,
  milks: <GiMilkCarton size={30} />,
  eggs: <GiLeg size={30} />,
  poultry: <GiChickenOven size={30} />,
  beef: <GiCow size={30} />,
  pork: <GiPig size={30} />,
  "alternative-meats": <IoFastFoodOutline size={30} />,
  seafood: <GiFishCorpse size={30} />,
  "dairy-products": <GiButterToast size={30} />,
};

const subCategories: Record<Exclude<Category, "">, string[]> = {
  "unprocessed-produce": [
    "fruit",
    "vegetables",
    "nuts",
    "herbs",
    "grains",
    "legumes",
  ],
  homemade: [
    "crafts",
    "baked-goods",
    "jams",
    "breads",
    "pasta",
    "oils",
    "candy",
  ],
  durables: ["canned-goods", "tools", "survival", "kitchen-wares"],
  "dairy-meat": [
    "milks",
    "eggs",
    "poultry",
    "beef",
    "pork",
    "alternative",
    "seafood",
    "dairy-products",
  ],
};

function isValidCategory(
  category: Category
): category is Exclude<Category, ""> {
  return category !== "" && category in subCategories;
}
const capitalizeWords = (str: string) => {
  return str
    .split("-")
    .map((word) =>
      word
        .split(" ")
        .map((subWord) => subWord.charAt(0).toUpperCase() + subWord.slice(1))
        .join(" ")
    )
    .join(" ");
};
const CategoryCard: React.FC<CategoryCardProps> = ({
  icon,
  title,
  description,
  onClick,
}) => (
  <Card
    className="w-[100%] h-full hover:cursor-pointer shadow-md hover:!border-black rounded-md"
    onClick={onClick}
  >
    <CardContent className=" h-full py-4 rounded-md flex flex-row items-center justify-between space-x-4">
      <div className="flex flex-col">
        <div className="text-lg font-light">{title}</div>
        <div className="text-sm text-gray-600 font-extralight">
          {description}
        </div>
      </div>
      <div className="flex-shrink-0">{icon}</div>
    </CardContent>
  </Card>
);

const SubCategoryCard: React.FC<SubCategoryCardProps> = ({
  title,
  isSelected,
  onClick,
  icon,
}) => (
  <Card
    className={`w-full rounded-md shadow-md hover:cursor-pointer min-h-[66px] ${
      isSelected && "bg-black text-white "
    }`}
    onClick={onClick}
  >
    <CardContent className={`rounded-xl p-4 flex justify-between items-center`}>
      <div className="text-lg font-extralight">{capitalizeWords(title)}</div>
      <div className="mb-1">{subcategoryIcons[title]}</div>
    </CardContent>
  </Card>
);

const GoBackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    onClick={onClick}
    className="fixed bottom-6 left-5 text-xl hover:cursor-pointer"
  >
    Back
  </Button>
);

const CategorySelection: React.FC<CategorySelectionProps> = ({
  setcategory,
  onGoBack,
}) => (
  <div className="w-full max-w-[1000px] mx-auto">
    <GoBackButton onClick={onGoBack} />
    <div className="flex flex-col space-y-4 w-full  max-w-[1000px] min-w-[280px]">
      <CategoryCard
        icon={<CiApple size={40} />}
        title="Unprocessed Produce"
        description="Apples, Peaches & Tomatoes"
        onClick={() => setcategory("unprocessed-produce")}
      />
      <CategoryCard
        icon={<CiHome size={40} />}
        title="Homemade"
        description="Apple Pie & Beeswax Candles"
        onClick={() => setcategory("homemade")}
      />
      <CategoryCard
        icon={<GiRopeCoil size={40} />}
        title="Durables"
        description="Canned Food & Solar Panels"
        onClick={() => setcategory("durables")}
      />
      <CategoryCard
        icon={<LuBeef size={40} />}
        title="Dairy & Meat"
        description="Milk Shares & Free-Range Chicken"
        onClick={() => setcategory("dairy-meat")}
      />
    </div>
  </div>
);

const SubCategorySelection: React.FC<SubCategorySelectionProps> = ({
  category,
  subcategory,
  setsubcategory,
  onGoBack,
  handleNext,
}) => {
  if (!isValidCategory(category)) {
    return null;
  }
  useEffect(() => {
    // Only proceed if subcategory is set (not initial empty state)
    if (subcategory) {
      handleNext();
    }
  }, [subcategory]);
  return (
    <div className="w-full max-w-[1000px] mx-auto">
      <GoBackButton onClick={onGoBack} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
        {subCategories[category].map((sub: string) => (
          <SubCategoryCard
            key={sub}
            title={sub.replace("-", " ")}
            isSelected={subcategory === sub}
            onClick={() => {
              setsubcategory(sub);
            }}
            icon
          />
        ))}
      </div>
    </div>
  );
};

interface ProductCategorySelectionProps {
  step: number;
  category: Category;
  handlePrevious: () => void;
  setcategory: (category: Category) => void;
  subcategory: subcategory;
  setsubcategory: (subcateory: subcategory) => void;
  handleNext: () => void;
}

const ProductCategorySelection: React.FC<ProductCategorySelectionProps> = ({
  subcategory,
  category,
  handlePrevious,
  setsubcategory,
  setcategory,
  handleNext,
}) => {
  return (
    <div className="flex  justify-center items-start min-h-screen w-full">
      <div className="flex flex-col gap-5 fade-in  w-full max-w-[700px] px-4">
        <p className="text-xl w-full font-light m-0 !leading-0 mb-2 px-2 text-center">
          Select a {subcategory !== "" ? <>subcategory</> : <>Category</>} for
          your Product
        </p>
        <div className="w-full px-2">
          {!category ? (
            <CategorySelection
              category={category}
              setcategory={setcategory}
              onGoBack={() => {
                handlePrevious();
              }}
            />
          ) : (
            <SubCategorySelection
              category={category}
              subcategory={subcategory}
              setsubcategory={setsubcategory}
              onGoBack={() => {
                setcategory("");
                setsubcategory("");
              }}
              handleNext={handleNext}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCategorySelection;
