import { OutfitFont } from "@/components/fonts";
import { Clock } from "lucide-react";

interface AvailabilityScoreProps {
  scores: {
    pickup: {
      workingmanScore: number;
      retireeScore: number;
      combinedScore: number;
    };
    delivery: {
      workingmanScore: number;
      retireeScore: number;
      combinedScore: number;
    };
  };
  type: "pickup" | "delivery";
}
const AvailabilityScore = ({ scores, type }: AvailabilityScoreProps) => {
  const typeScores = scores[type];

  const getColor = (score: number) => {
    switch (score) {
      case 3:
        return "text-green-500";
      case 2:
        return "text-yellow-500";
      case 1:
        return "text-red-500";
      default:
        return "text-gray-300";
    }
  };
  const getDotColor = (score: number, dotIndex: number) => {
    if (dotIndex >= score) {
      return "bg-gray-200"; // Default inactive color
    }

    switch (score) {
      case 3:
        return "bg-green-500";
      case 2:
        return "bg-yellow-500";
      case 1:
        return "bg-red-500";
      default:
        return "bg-gray-200";
    }
  };
  return (
    <div className="flex items-center justify-between space-x-1">
      <div
        className={`flex items-center text-xs ${getColor(
          typeScores.combinedScore
        )}`}
      >
        <Clock size={14} className="mr-1" />
        <span className={`${OutfitFont.className} font-medium`}>
          {type === "pickup" ? "Pickup Availability" : "Delivery Availability"}
        </span>
      </div>
      <div className="flex space-x-1">
        {[0, 1, 2].map((dotIndex) => (
          <div
            key={dotIndex}
            className={`w-2 h-2 rounded-full ${getDotColor(
              typeScores.combinedScore,
              dotIndex
            )}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AvailabilityScore;
