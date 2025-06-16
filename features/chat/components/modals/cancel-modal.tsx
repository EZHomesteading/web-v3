"use client";
//modal that handles order cancellation(need to add logic to start refun process dependent on step the order is canceled)
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Modal from "@/features/chat/components/modals/modal";
import { Button } from "@/components/ui/button";
import { ChatOrder } from "chat-types";
import Toast from "@/components/ui/toast";

interface ConfirmModalProps {
  isOpen?: boolean;
  onClose: () => void;
  order: ChatOrder | null;
  otherUser: string | undefined;
  convoId: string | null | undefined;
  otherUserRole: string | undefined;
  isSeller: boolean;
  orderGroupId: string | null;
}

const CancelModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  order,
  otherUser,
  convoId,
  otherUserRole,
  isSeller,
  orderGroupId,
}) => {
  const session = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = React.useState("");
  const handleTextChange = (e: any) => {
    setText(e.target.value);
  };

  const onDelete = async () => {
    if (text === "") {
      Toast({ message: "Please provide a reason for cancellation" });
      return;
    }

    setIsLoading(true);

    try {
      const paymentResponse = await axios.post("/api/stripe/cancel-intent", {
        paymentId: order?.paymentIntentId,
      });

      if (!paymentResponse.data.success) {
        Toast({
          message:
            paymentResponse.data.message ||
            "Failed to process payment cancellation",
        });
        return;
      }

      const action = paymentResponse.data.action;
      if (action === "canceled") {
        Toast({ message: "Payment authorization canceled successfully" });
      } else if (action === "refunded") {
        Toast({ message: "Payment refunded successfully" });
      }

      await axios.post("/api/useractions/update/update-order", {
        orderId: order?.id,
        status: "CANCELED",
        completedAt: new Date(),
      });

      await axios.post("/api/useractions/checkout/remove-order-from-group", {
        orderGroupId: orderGroupId,
        orderId: order?.id,
      });

      await axios.post("/api/chat/messages", {
        message: `I have canceled this item, because: ${text}`,
        messageOrder: "CANCELED",
        conversationId: convoId,
        otherUserId: otherUser,
      });

      await axios.post("/api/chat/updateListingOnCancel", {
        order: order,
      });

      Toast({ message: "Order canceled successfully" });
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Error canceling order:", error);
      Toast({
        message: "Failed to cancel order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sm:flex">
        <div>
          <Dialog.Title
            as="h3"
            className="text-base font-semibold leading-6 text-gray-900"
          >
            Reason for order cancellation?
          </Dialog.Title>
          <textarea
            className="w-[100%] h-[60%] resize-none  border-[2px] border-gray- rounded-sm"
            name="cancel"
            id="cancel"
            value={text}
            onChange={handleTextChange}
          ></textarea>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse ">
        <Button disabled={isLoading} onClick={onDelete}>
          Cancel Order
        </Button>
        <Button disabled={isLoading} onClick={onClose}>
          Go back
        </Button>
      </div>
    </Modal>
  );
};

export default CancelModal;
