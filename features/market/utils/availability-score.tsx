import { getTextColor, getColor } from "@/utils/listing-helpers";
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
        className={`flex items-center text-xs ${getTextColor(
          typeScores.combinedScore
        )}`}
      >
        <Clock size={14} className="mr-1" />
        <div className={`${OutfitFont.className} font-medium`}>
          {type === "pickup" ? "Pickup Availability" : "Delivery Availability"}
        </div>
      </div>

      {typeScores.combinedScore === 0 ? (
        <div className={`text-xs ${getTextColor(typeScores.combinedScore)}`}>
          None
        </div>
      ) : typeScores.combinedScore === 1 ? (
        <div className={`text-xs ${getTextColor(typeScores.combinedScore)}`}>
          Poor
        </div>
      ) : typeScores.combinedScore === 2 ? (
        <div className={`text-xs ${getTextColor(typeScores.combinedScore)}`}>
          Fair
        </div>
      ) : typeScores.combinedScore === 3 ? (
        <div className={`text-xs ${getTextColor(typeScores.combinedScore)}`}>
          Good
        </div>
      ) : null}
    </div>
  );
};

export default AvailabilityScore;
