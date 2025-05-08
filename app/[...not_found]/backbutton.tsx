"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-full hover:bg-green-600 transition-colors"
    >
      <ArrowLeft size={20} />
      Back to Homepage
    </button>
  );
};
export default BackButton;
