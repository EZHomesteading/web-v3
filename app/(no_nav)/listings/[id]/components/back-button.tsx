"use client";

import { useRouter } from "next/navigation";
import { PiArrowLeftThin } from "react-icons/pi";

interface prop {
  className: string;
}

const BackButton = ({ className }: prop) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`rounded-full border text-black p-3 ${className || ""}`}
    >
      <PiArrowLeftThin />
    </button>
  );
};
export default BackButton;
