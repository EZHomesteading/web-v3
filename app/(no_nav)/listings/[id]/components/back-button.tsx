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
      onClick={() => router.push("/market")}
      className={`flex flex-row items-center  justify-center rounded-full border text-black p-3 ${
        className || ""
      }`}
    >
      <PiArrowLeftThin className="mr-2" />
      Continue Shopping
    </button>
  );
};
export default BackButton;
