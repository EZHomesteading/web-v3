import { useState } from "react";
import { OutfitFont } from "@/components/fonts";
import WeelkyScheduleChartV2 from "../weekly-schedule-chart";
import { NewLocProps } from "../helper-components";

interface FinishNewLocProps extends NewLocProps {}

export function Finish({ formData }: FinishNewLocProps) {
  const [openMonths, setOpenMonths] = useState<number[]>(
    formData.selectedMonths
  );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${OutfitFont.className}`}
    >
      {/* months section */}
      <div className="flex flex-col mb-3">
        <h2 className="text-xl font-normal text-center mb-3">Month Schedule</h2>
        <div className="rounded-lg px-0 sm:px-8">
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {months.map((month, index) => (
                <button
                  key={month}
                  className={`p-8 2xl:p-[3.75rem] hover:cursor-auto text-sm border-[1px] shadow-md rounded-md ${
                    openMonths.includes(index)
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* weekly schedule */}
      <WeelkyScheduleChartV2
        hours={formData.hours}
        currentConfig={formData.currentConfig || "pickup"}
        barColor={`rgb(148 163 184)`}
        showSubTitle={false}
        viewBoxHeight={600}
        viewBoxWidth={750}
        handleDayClick={() => {}}
        editHours={false}
      />
    </div>
  );
}
