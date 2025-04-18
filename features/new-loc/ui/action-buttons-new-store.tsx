interface ActionButtonsProps {
  fulfillmentStyle: FulfillmentType;
  handleFinish: () => void;
  handleFinishBoth: (type: "sameForBoth" | "delivery" | "pickup") => void;
  completedSteps?: Array<"pickup" | "delivery">;
  savePickupSetDelivery: () => void;
}

export default function ActionButtonsNewStore({
  fulfillmentStyle,
  handleFinish,
  handleFinishBoth,
  completedSteps = [],
  savePickupSetDelivery,
}: ActionButtonsProps) {
  const hasntCompletedDelivery =
    fulfillmentStyle === FulfillmentType.SEPARATE_HOURS &&
    completedSteps.length < 2;

  return (
    <>
      {fulfillmentStyle === FulfillmentType.SHARED_HOURS ? (
        <button
          onClick={() => handleFinishBoth("sameForBoth")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-green-800 fixed bottom-2 right-4 "
        >
          Save Hours for Both
        </button>
      ) : hasntCompletedDelivery ? (
        <button
          className="px-4 py-2 bg-black text-white rounded fixed bottom-2 right-4 "
          onClick={savePickupSetDelivery}
        >
          Set Delivery Hours
        </button>
      ) : (
        <button
          onClick={handleFinish}
          className="px-4 py-2 bg-black text-white rounded hover:bg-green-800 fixed bottom-2 right-4 "
        >
          Save Hours
        </button>
      )}
    </>
  );
}
