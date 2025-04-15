// File: body.tsx
"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";

import { useMessages } from "./hooks/use-messages";
import { useOrderActions } from "./hooks/use-order-actions";
import { usePageVisibility } from "@/features/chat/hooks/visibility-state";
import { MessageHeader } from "./new/message-header";
import { MessageList } from "./new/message-list";
import { OptionsPopover } from "./options/options-popover";
import { ChatModals } from "../modals/chat-modals";

import { BodyProps } from "./new/types";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

const Body: React.FC<BodyProps> = ({
  initialMessages = [],
  otherUser,
  adminMessages,
  order,
  user,
  orderGroupId,
  conversationId,
  listings,
}) => {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isVisible = usePageVisibility();

  const { messages, lastMessage, setMessages } = useMessages(initialMessages);

  const {
    disputeOpen,
    confirmOpen,
    cancelOpen,
    escalateOpen,
    refundOpen,
    cancel,
    dispute,
    escalate,
    refund,
    confirm,
    review,
    setDisputeOpen,
    setConfirmOpen,
    setCancelOpen,
    setEscalateOpen,
    setRefundOpen,
  } = useOrderActions(order, messages, lastMessage, user);

  // Handle message seen status
  useEffect(() => {
    if (
      isVisible &&
      messages[messages.length - 1]?.seen !== true &&
      messages[messages.length - 1]?.sender.email !== user.email
    ) {
      axios.post(`/api/chat/conversations/${conversationId}/seen`, {
        seen: true,
      });
    }
  }, [conversationId, messages, isVisible, user.email]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef?.current?.scrollIntoView();
  }, [initialMessages, conversationId]);

  // Format pickup date if available
  const formattedPickupDate = order?.pickupDate
    ? formatPickupDate(order.pickupDate)
    : "No pickup date set";

  const itemText = order?.items.length === 1 ? "item" : "items";
  const sellerRole =
    otherUser?.id === order?.sellerId ? otherUser?.role : user.role;

  return (
    <div className="flex-1 overflow-y-auto">
      <ChatModals
        orderGroupId={orderGroupId}
        cancelOpen={cancelOpen}
        confirmOpen={confirmOpen}
        disputeOpen={disputeOpen}
        escalateOpen={escalateOpen}
        refundOpen={refundOpen}
        onCloseCancel={() => setCancelOpen(false)}
        onCloseConfirm={() => setConfirmOpen(false)}
        onCloseDispute={() => setDisputeOpen(false)}
        onCloseEscalate={() => setEscalateOpen(false)}
        onCloseRefund={() => setRefundOpen(false)}
        order={order}
        otherUser={otherUser}
        user={user}
        isSeller={user.id === order?.sellerId}
      />
      <OptionsPopover
        outfit={outfit}
        listings={listings}
        order={order}
        otherUser={otherUser}
        user={user}
        orderGroupId={orderGroupId}
        router={router}
        lastMessage={lastMessage}
        cancel={cancel}
        dispute={dispute}
        escalate={escalate}
        refund={refund}
        confirm={confirm}
        review={review}
        onOpenCancel={() => setCancelOpen(true)}
        onOpenDispute={() => setDisputeOpen(true)}
        onOpenEscalate={() => setEscalateOpen(true)}
        onOpenRefund={() => setRefundOpen(true)}
        onOpenConfirm={() => setConfirmOpen(true)}
      />
      <MessageHeader
        outfit={outfit}
        orderItemCount={order?.items.length}
        itemText={itemText}
        sellerRole={sellerRole}
        formattedPickupDate={formattedPickupDate}
        totalPrice={order?.totalPrice}
      />

      <div className={`pb-12 sm:pb-0`}></div>

      <MessageList
        messages={messages}
        adminMessages={adminMessages}
        orderGroupId={orderGroupId}
        listings={listings}
        user={user}
        conversationId={conversationId}
        otherUser={otherUser}
        order={order}
      />

      <div className="pt-24" ref={bottomRef} />
    </div>
  );
};

export default Body;

function formatPickupDate(date: Date): string {
  try {
    return format(date, "EEE MMM d, h:mma");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}
