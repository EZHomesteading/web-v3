"use client";
import Link from "next/link";
import { OutfitFont } from "@/components/fonts";
import BarnIcon from "@/public/icons/barn"; // Import the barn icon

const Logo = () => {
  return (
    <Link
      href={"/"}
      className="select-none flex items-center gap-2 hover:cursor-pointer transition-colors duration-200 hover:text-green-800"
      aria-label="Go to homepage"
    >
      <div className="flex flex-col pb-4 sm:pb-2 items-center justify-center">
        <BarnIcon className="h-8 w-8" />
        <div className={`text-xs ${OutfitFont.className}`}>Home</div>
      </div>
      <span
        className={`md:block hidden font-bold tracking-tight ${OutfitFont.className}`}
      >
        EZHomesteading
      </span>
    </Link>
  );
};

export default Logo;
