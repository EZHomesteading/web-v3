import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Location } from "@prisma/client";
import RouteOptimizer from "./route-optimizer";
import { X } from "lucide-react";

interface RouteOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  googleMapsApiKey: string;
  initialLocation: { lat: number; lng: number };
  selectedTime: Date;
  setPickupTimes: any;
  setStartLoc: React.Dispatch<React.SetStateAction<any[]>>;
  setEndLoc: React.Dispatch<React.SetStateAction<any[]>>;
  startDelay: number;
}

const RouteOptimizerModal: React.FC<RouteOptimizerModalProps> = ({
  setStartLoc,
  setEndLoc,
  isOpen,
  onClose,
  locations,
  googleMapsApiKey,
  initialLocation,
  selectedTime,
  setPickupTimes,
  startDelay,
}) => {
  // Handler for dialog's built-in open change
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden"
        style={{ zIndex: 50 }}
      >
        <DialogTitle className="sr-only">Route Optimizer</DialogTitle>

        {/* Custom close button with higher z-index */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full bg-white hover:bg-gray-100 z-[999] shadow-md"
          type="button"
          aria-label="Close dialog"
        >
          <X size={24} />
        </button>

        {/* Global styles for Google Maps elements */}
        <style jsx global>{`
          .pac-container {
            z-index: 9999999 !important;
            position: fixed !important;
            pointer-events: auto !important;
          }

          [role="dialog"] {
            z-index: 9999998 !important;
          }

          .google-maps-input {
            pointer-events: auto !important;
            position: relative !important;
            z-index: 9999998 !important;
          }
        `}</style>

        <div className="w-full h-full relative">
          <RouteOptimizer
            startDelay={startDelay}
            setEndLoc={setEndLoc}
            setStartLoc={setStartLoc}
            initialTime={selectedTime}
            locations={locations}
            googleMapsApiKey={googleMapsApiKey}
            initialLocation={initialLocation}
            onClose={onClose}
            isOpen={isOpen}
            setCartPickupTimes={setPickupTimes}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouteOptimizerModal;
