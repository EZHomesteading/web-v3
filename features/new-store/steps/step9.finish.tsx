import { OutfitFont } from "@/components/fonts";
import { NewStoreFormData, monthsOfTheYear } from "../utils";
import WeelkyScheduleChart from "../ui/weekly-schedule-chart-new-store";

const FinishNewStoreStep = ({ formData }: { formData: NewStoreFormData }) => {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${OutfitFont.className}`}
    >
      <MonthsSection formData={formData} />
      <div className="h-[600px]">
        <WeelkyScheduleChart
          location={formData}
          barColor={`rgb(148 163 184)`}
          showSubTitle={false}
          viewBoxHeight={600}
          viewBoxWidth={750}
          handleDayClick={() => { }}
          editHours={false}
        />
      </div>
    </div>
  );
};

export default FinishNewStoreStep;

function MonthsSection({ formData }: { formData: NewStoreFormData }) {
  return (
    <div className="flex flex-col mb-3">
      <h2 className="text-xl font-normal text-center mb-3">Month Schedule</h2>
      <div className="rounded-lg px-0 sm:px-8">
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {monthsOfTheYear.map((month, index) => (
              <button
                key={month}
                className={`p-8 2xl:p-[3.75rem] hover:cursor-auto text-sm border-[1px] shadow-md rounded-md ${formData.selectedMonths.includes(index)
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
  );
}
// <div className="fixed zmax bottom-0 bg-white w-full h-12">
// <div
//   className={`flex justify-between sm:justify-end items-center gap-x-2 w-full h-12 pr-2 pl-2 border-t`}
// >
//   <Button
//     onClick={() =>
//       router.push(`/selling/availability-calendar/${locationId}`)
//     }
//     className="px-4 mr-2 py-2 border rounded "
//   >
//     Set Vacation Days
//   </Button>
//   <Button
//     onClick={() => router.push(`/create?id=${locationId}`)}
//     className="px-4 py-2 border rounded "
//   >
//     Create a Listing
//   </Button>
// </div>
// </div>
