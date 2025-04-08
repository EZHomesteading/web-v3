import { getColor } from "@/utils/avail-score-handlers";
import { OutfitFont } from "../../../components/fonts";
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
            className={`w-2 h-2 rounded-full ${getColor(
              typeScores.combinedScore
            )}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AvailabilityScore;
