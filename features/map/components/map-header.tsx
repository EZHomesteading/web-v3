import { OutfitFont } from "@/components/fonts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PopoverContent } from "@radix-ui/react-popover";
import { CiCircleQuestion, CiEdit, CiBookmarkRemove } from "react-icons/ci";
import { MdOutlineEditOff } from "react-icons/md";
import { IoCheckmark } from "react-icons/io5";

interface MapHeaderProps {
  isDrawingEnabled: boolean;
  startDrawing: () => void;
  stopDrawing: () => void;
  resetMap: () => void;
  drawnShape: google.maps.LatLng[] | null;
  isApplyButtonVisible: boolean;
  applyDrawnShape: () => void;
}

const MapHeader = ({
  isDrawingEnabled,
  startDrawing,
  stopDrawing,
  resetMap,
  drawnShape,
  isApplyButtonVisible,
  applyDrawnShape,
}: MapHeaderProps) => {
  return (
    <>
      <Popover>
        <PopoverTrigger
          className={`${OutfitFont.className} absolute top-1 left-1 z-10 bg-slate-800 text-white shadow-md px-1 py-2 rounded-lg text-xs sm:text-sm flex flex-row items-center`}
        >
          <CiCircleQuestion className="mr-1" size={20} />
          Drawing Tool
        </PopoverTrigger>
        <PopoverContent className="bg-slate-800 text-white mt-1 ml-1 rounded-md z">
          <ul className={`${OutfitFont.className} p-2 rounded-md text-xs`}>
            <li className="flex flex-row">
              - Click
              <button className="ml-1 text-xs bg-teal-600 hover:bg-teal-900 flex flex-row items-center rounded-md px-1">
                <CiEdit size={15} className="mr-1" />
                Start Drawing
              </button>
            </li>
            <li>- Click or press and drag a shape</li>
            <li className="flex flex-row">
              - Click{" "}
              <button className="ml-1 text-xs bg-green-600 hover:bg-green-800 flex flex-row items-center rounded-md px-1">
                <IoCheckmark size={15} className="ml-1" />
                Apply
              </button>
            </li>
            <li>- Click on a marker for more info</li>
            <li className="flex flex-row">
              - Click{" "}
              <button
                onClick={resetMap}
                className="mx-1 text-xs bg-red-500 hover:bg-red-700 flex flex-row items-center rounded-md px-1"
              >
                <CiBookmarkRemove size={15} className="ml-1" />
                Remove Filters
              </button>
              to remove drawing filters
            </li>
          </ul>
        </PopoverContent>
      </Popover>

      {!isDrawingEnabled ? (
        <Button
          className="absolute top-1 right-1 z-10 p-1 text-xs sm:text-sm bg-teal-600 hover:bg-teal-900"
          onClick={startDrawing}
        >
          <CiEdit size={20} className="mr-1" />
          Start Drawing
        </Button>
      ) : (
        <Button
          className="absolute top-1 right-1 z-10 p-1 text-xs md:text-sm bg-red-500 hover:bg-red-700"
          onClick={stopDrawing}
        >
          <MdOutlineEditOff size={20} className="ml-1" />
          Stop Drawing
        </Button>
      )}

      {drawnShape && (
        <Button
          className="absolute top-11 right-1 z-10 p-1 bg-red-500 hover:bg-red-700"
          onClick={resetMap}
        >
          <CiBookmarkRemove size={20} className="ml-1" />
          Remove Filters
        </Button>
      )}

      {isApplyButtonVisible && (
        <Button
          className="p-1 text-xs sm:text-sm absolute top-11 right-1 z-10 bg-green-600 hover:bg-green-800"
          onClick={applyDrawnShape}
        >
          <IoCheckmark size={20} className="ml-1" />
          Apply
        </Button>
      )}
    </>
  );
};

export default MapHeader;
