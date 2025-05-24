import { OutfitFont } from "@/components/fonts";
import { Switch } from "@/components/ui/switch";

interface DrawingControlsProps {
  showCoops: boolean;
  setShowCoops: (value: boolean) => void;
  showProducers: boolean;
  setShowProducers: (value: boolean) => void;
}

const DrawingControls = ({
  showCoops,
  setShowCoops,
  showProducers,
  setShowProducers,
}: DrawingControlsProps) => {
  return (
    <div className="flex flex-col items-center justify-between">
      <div className="flex items-center gap-x-2 text-md font-medium mb-2 whitespace-nowrap">
        <Switch
          checked={showCoops}
          onCheckedChange={setShowCoops}
          className="w-8 h-4 mr-2"
        />
        <span>Co-ops</span>
      </div>
      <div className="flex items-center justify-start gap-x-2 text-md font-medium whitespace-nowrap">
        <Switch
          checked={showProducers}
          onCheckedChange={setShowProducers}
          className="w-8 h-4 mr-2"
        />
        <span>Growers</span>
      </div>
    </div>
  );
};

export default DrawingControls;
