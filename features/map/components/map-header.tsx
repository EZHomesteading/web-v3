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
      {" "}
      <div className="absolute  flex items-center justify-center top-1 w-full inset-x-0 mx-auto ">
        <Popover>
          <PopoverTrigger className={`${OutfitFont.className} z-10`}>
            <CiCircleQuestion className="mr-1" size={40} />
          </PopoverTrigger>
          <PopoverContent className="bg-slate-800 z-9999 text-white mt-1 ml-1 rounded-md z-10">
            <ul className={`${OutfitFont.className} p-2 rounded-md text-md`}>
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
            className="z-10 text-xs sm:text-sm bg-teal-600 hover:bg-teal-900"
            onClick={startDrawing}
          >
            <CiEdit size={20} className="mr-1" />
            Start Drawing
          </Button>
        ) : (
          <Button
            className=" z-10 text-xs md:text-sm bg-red-500 hover:bg-red-700"
            onClick={stopDrawing}
          >
            <MdOutlineEditOff size={20} className="mr-1" />
            Stop Drawing
          </Button>
        )}

        {drawnShape && (
          <Button
            className=" z-10 p-1 ml-2 bg-red-500 hover:bg-red-700"
            onClick={resetMap}
          >
            <CiBookmarkRemove size={20} className="ml-1" />
            Remove Filters
          </Button>
        )}

        {isApplyButtonVisible && (
          <Button
            className="p-1 text-xs ml-2 sm:text-sm z-10 bg-green-600 hover:bg-green-800"
            onClick={applyDrawnShape}
          >
            <IoCheckmark size={20} className="ml-1" />
            Apply
          </Button>
        )}
      </div>
    </>
  );
};

export default MapHeader;
