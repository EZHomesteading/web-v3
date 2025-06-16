"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { IconType } from "react-icons";
import qs from "query-string";
import {
  GiGrainBundle,
  GiBread,
  GiTomato,
  GiMilkCarton,
  GiCakeSlice,
  GiCannedFish,
  GiButter,
  GiPeanut,
  GiHerbsBundle,
  GiClothes,
  GiHorseshoe,
  GiRaspberry,
  GiStrawberry,
  GiChicken,
} from "react-icons/gi";
import { LuBeef, LuBean, LuMilk } from "react-icons/lu";
import { CiApple, CiForkAndKnife } from "react-icons/ci";
import { FaAppleAlt } from "react-icons/fa";
import { ChevronLeft } from "lucide-react";

import { TbCheese, TbEggs, TbMeat, TbPig } from "react-icons/tb";
import { IoFishOutline } from "react-icons/io5";
import { MdOutlineSolarPower } from "react-icons/md";
import { UserRole } from "@prisma/client";
import Container from "../../../components/Container";
import Filters from "../components/modals/filter.client";
import { OutfitFont } from "../../../components/fonts";
import { Button } from "@/components/ui/button";

export const categories = [
  {
    label: "Produce",
    icon: FaAppleAlt,
    url: "unprocessed-produce",
  },
  {
    label: "Homemade",
    icon: GiCakeSlice,
    url: "homemade",
  },
  {
    label: "Durables",
    icon: GiCannedFish,
    url: "durable-products",
  },
  {
    label: "Deli",
    icon: GiMilkCarton,
    url: "dairy-meat",
  },
];

export const unprocessedProduce = [
  { label: "Fruits", icon: CiApple, url: "fruit" },
  { label: "Vegetables", icon: GiTomato, url: "vegetables" },
  { label: "Nuts", icon: GiPeanut, url: "nuts" },
  { label: "Herbs", icon: GiHerbsBundle, url: "herbs" },
  { label: "Legumes", icon: LuBean, url: "legumes" },
];

export const homemade = [
  { label: "Baked Goods", icon: GiCakeSlice, url: "baked-goods" },
  { label: "Crafts", icon: GiClothes, url: "crafts" },
  { label: "Jams", icon: GiRaspberry, url: "jams" },
  { label: "Preserves", icon: GiStrawberry, url: "preserves" },
  { label: "Breads", icon: GiBread, url: "breads" },
];

export const durableProducts = [
  { label: "Canned Goods", icon: GiCannedFish, url: "canned-goods" },
  { label: "Dry Goods", icon: GiGrainBundle, url: "dry-goods" },
  { label: "Survival", icon: MdOutlineSolarPower, url: "survival" },
  { label: "Tools", icon: GiHorseshoe, url: "tools" },
  { label: "Kitchen Ware", icon: CiForkAndKnife, url: "kitchen-wares" },
];

export const dairyAndMeats = [
  { label: "Milk", icon: LuMilk, url: "milks" },
  { label: "Eggs", icon: TbEggs, url: "eggs" },
  { label: "Poultry", icon: GiChicken, url: "poultry" },
  { label: "Beef", icon: LuBeef, url: "beef" },
  { label: "Pork", icon: TbPig, url: "pork" },
  { label: "Exotic Meat", icon: TbMeat, url: "alternative-meats" },
  { label: "Seafood", icon: IoFishOutline, url: "seafood" },
  { label: "Butter", icon: GiButter, url: "butter" },
  { label: "Cheese", icon: TbCheese, url: "cheese" },
];

type CategoryKey = "Produce" | "Homemade" | "Durables" | "Deli";

type SubcategoryItem = { label: string; icon: IconType; url: string };

const subcategories: Record<CategoryKey, SubcategoryItem[]> = {
  Produce: unprocessedProduce,
  Homemade: homemade,
  Durables: durableProducts,
  Deli: dairyAndMeats,
};

interface CategoryBoxProps {
  icon: IconType;
  label: string;
  url: string;
  selected?: boolean;
  onClick: () => void;
  isCompact?: boolean;
}

const CategoryBox: React.FC<CategoryBoxProps> = ({
  icon: Icon,
  label,
  selected,
  onClick,
  isCompact = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center  justify-center gap-2 ${
        isCompact ? "px-2 pt-1" : "px-3 pt-2"
      } hover:text-neutral-800 transition cursor-pointer flex-shrink-0 ${
        selected ? "border-b-neutral-800" : "border-transparent"
      } ${selected ? "text-neutral-800" : "text-neutral-500"}`}
    >
      <Icon size={isCompact ? 20 : 25} />
      <div
        className={`${OutfitFont.className} font-light ${
          isCompact ? "text-xs" : "text-xs"
        } whitespace-nowrap text-center`}
      >
        {label}
      </div>
    </div>
  );
};

interface Props {
  role?: UserRole;
}

const Categories = ({ role }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);

  useEffect(() => {
    const cat = searchParams?.get("category") ?? null;
    const subcat = searchParams?.get("subcategory") ?? null;
    setCategory(cat);
    setSubcategory(subcat);
    setShowSubcategories(!!cat && !subcat);
  }, [searchParams]);

  const handleCategoryClick = useCallback(
    (clickedUrl: string) => {
      const clickedCategory = categories.find((cat) => cat.url === clickedUrl);
      const currentParams = searchParams
        ? qs.parse(searchParams.toString())
        : {};
      delete currentParams.q;
      if (clickedCategory) {
        const updatedParams = {
          ...currentParams,
          category: clickedUrl,
          subcategory: undefined,
        };
        setCategory(clickedUrl);
        setSubcategory(null);
        setShowSubcategories(true);
        router.push(`/market?${qs.stringify(updatedParams)}`, {
          scroll: false,
        });
      } else {
        const updatedParams = {
          ...currentParams,
          category: category,
          subcategory: clickedUrl,
        };
        setSubcategory(clickedUrl);
        router.push(`/market?${qs.stringify(updatedParams)}`, {
          scroll: false,
        });
      }
    },
    [router, category, searchParams]
  );

  const handleBackToCategories = () => {
    const currentParams = searchParams ? qs.parse(searchParams.toString()) : {};
    delete currentParams.category;
    delete currentParams.subcategory;

    setCategory(null);
    setSubcategory(null);
    setShowSubcategories(false);
    router.push(`/market?${qs.stringify(currentParams)}`, {
      scroll: false,
    });
  };

  const renderTitleSection = () => {
    // Show title when no category is selected
    if (!category) {
      return (
        <motion.div
          key="title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-4"
        >
          <div className="text-center">
            <h2
              className={`${OutfitFont.className} text-lg font-medium text-neutral-800 mb-1`}
            >
              Browse by Category
            </h2>
            <p className={`${OutfitFont.className} text-sm text-neutral-600`}>
              Filter products by selecting a category below
            </p>
          </div>
        </motion.div>
      );
    }

    // Show selected category when browsing subcategories
    if (category && showSubcategories) {
      const selectedCategory = categories.find((cat) => cat.url === category);
      return (
        <motion.div
          key="category-selected"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            onClick={handleBackToCategories}
            className="flex items-center gap-2 text-white hover:text-neutral-800 transition-colors"
          >
            <ChevronLeft size={16} />
            <span className={`${OutfitFont.className} text-sm`}>Back</span>
          </Button>

          <div className="flex items-center bg-neutral-50 px-3  rounded-lg border">
            {selectedCategory && (
              <div>
                <CategoryBox
                  key={selectedCategory.label}
                  label={selectedCategory.label}
                  icon={selectedCategory.icon}
                  url={selectedCategory.url}
                  onClick={() => {}}
                  selected={true}
                  isCompact={true}
                />
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    // Show breadcrumb when subcategory is selected
    if (category && subcategory) {
      const selectedCategory = categories.find((cat) => cat.url === category);
      const currentSubcategories =
        subcategories[selectedCategory?.label as CategoryKey];
      const selectedSubcategory = currentSubcategories?.find(
        (subcat) => subcat.url === subcategory
      );

      return (
        <motion.div
          key="breadcrumb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-3"
        >
          <Button
            onClick={handleBackToCategories}
            className=" gap-2 text-white hover:text-neutral-800 transition-colors"
          >
            <ChevronLeft size={16} />
            <span className={`${OutfitFont.className} text-sm`}>
              All Categories
            </span>
          </Button>

          {/* Selected Category */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className=" bg-neutral-50 px-3  rounded-lg border"
          >
            {selectedCategory && (
              <CategoryBox
                key={selectedCategory.label}
                label={selectedCategory.label}
                icon={selectedCategory.icon}
                url={selectedCategory.url}
                onClick={() => {
                  // Go back to subcategory view
                  const currentParams = searchParams
                    ? qs.parse(searchParams.toString())
                    : {};
                  const updatedParams = {
                    ...currentParams,
                    category: category,
                    subcategory: undefined,
                  };
                  setSubcategory(null);
                  setShowSubcategories(true);
                  router.push(`/market?${qs.stringify(updatedParams)}`, {
                    scroll: false,
                  });
                }}
                selected={false}
                isCompact={true}
              />
            )}
          </motion.div>

          {/* Arrow Indicator */}
          <div className="text-neutral-400">
            <ChevronLeft size={16} className="rotate-180" />
          </div>

          {/* Selected Subcategory */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className=" bg-blue-50 px-3 rounded-lg border border-blue-200"
          >
            {selectedSubcategory && (
              <CategoryBox
                key={selectedSubcategory.label}
                label={selectedSubcategory.label}
                icon={selectedSubcategory.icon}
                url={selectedSubcategory.url}
                onClick={() => {}}
                selected={true}
                isCompact={true}
              />
            )}
          </motion.div>
        </motion.div>
      );
    }
  };

  const renderSelectableCategories = () => {
    // Show main categories when no category is selected
    if (!category) {
      return (
        <motion.div
          key="main-categories"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-row items-center  justify-evenly w-full overflow-x-auto"
        >
          {categories.map((item) => (
            <CategoryBox
              key={item.label}
              label={item.label}
              icon={item.icon}
              url={item.url}
              onClick={() => handleCategoryClick(item.url)}
              selected={item.url === category}
            />
          ))}
        </motion.div>
      );
    }

    // Show subcategories when category is selected
    if (category) {
      const selectedCategory = categories.find((cat) => cat.url === category);
      const currentSubcategories =
        subcategories[selectedCategory?.label as CategoryKey];

      return (
        <motion.div
          key="subcategories"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-row items-center justify-evenly w-full overflow-x-auto"
        >
          {currentSubcategories?.map((item, index) => (
            <CategoryBox
              key={item.label}
              label={item.label}
              icon={item.icon}
              url={item.url}
              onClick={() => handleCategoryClick(item.url)}
              selected={item.url === subcategory}
            />
          ))}
        </motion.div>
      );
    }
  };

  return (
    <Container>
      <div className={`${OutfitFont.className} flex flex-col`}>
        <div className="flex items-center mx-10 justify-center lg:justify-between min-h-[70px]">
          <div className="flex-shrink-0 mr-2 ml-10 sm:mr-16 sm:ml-2 ">
            <Filters role={role} />
          </div>
          <div className="flex-shrink-0 mr-10">
            <AnimatePresence mode="wait">
              {renderTitleSection()}
            </AnimatePresence>
          </div>
          {/* Categories section - only visible on md screens and up, positioned inside the flex container */}
          <div className="hidden lg:block sticky w-full overflow-x-auto">
            <AnimatePresence mode="wait">
              {renderSelectableCategories()}
            </AnimatePresence>
          </div>
        </div>
        {/* Categories section - only visible on screens smaller than md, positioned outside the flex container */}
        <div className="block lg:hidden sticky w-full overflow-x-auto">
          <AnimatePresence mode="wait">
            {renderSelectableCategories()}
          </AnimatePresence>
        </div>
      </div>
    </Container>
  );
};

export default Categories;
