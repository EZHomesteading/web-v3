import { OutfitFont } from "@/components/fonts";
import { NewStoreFormData } from "../utils";

export default function HeaderNewStore({
  step,
  formData,
}: {
  step: number;
  formData: NewStoreFormData;
}) {
  function getHeading() {
    switch (step) {
      case 2:
        return {
          title: "How would you like to sell your produce?",
          descriptions: [
            "If you have one Co-Op location, you can purchase from Growers",
          ],
        };
      case 3:
        return {
          title: "Where will you be selling from?",
          descriptions: [
            "Your location is approximate until a buyer purchases from you",
          ],
        };
      case 4:
        return {
          title: "Set Location Mode",
          descriptions: [
            "How would you like to fufill orders?",
            "Fine-tune your daily schedule later in settings",
          ],
        };
      case 5:
        return {
          title: "Select all months you plan to operate",
          descriptions: ["Select a month if you'll be open any day during it"],
        };
      case 6:
        return {
          title: "Select Days with the Same Hours",
          descriptions: [
            "You'll return here to set hours for additional days until your schedule is complete",
          ],
        };
      case 7:
        return {
          title: "Set Open & Close Hours for",
          descriptions: [
            `${formData?.selectedDays.join(", ")}`,
            "Fine-tune your daily schedule later in settings",
          ],
        };
      case 8:
        return {
          title: "Review Schedule",
          descriptions: [
            "You will be able to edit specific days later in settings",
          ],
        };
      case 9:
        return {
          title: "Congratulations!",
          descriptions: ["You've successfully added your first store & hours"],
        };
      default:
        return {
          title: "",
          descriptions: [],
        };
    }
  }

  const { title, descriptions } = getHeading();

  return (
    <>
      <div
        className={`${OutfitFont.className} items-center text-center text-2xl`}
      >
        {title}
      </div>
      {descriptions.map((description: string, index: number) => (
        <div
          key={index}
          className={`text-xs text-center text-neutral-500 ${OutfitFont.className}`}
        >
          {description}
        </div>
      ))}
    </>
  );
}
