"use client";

import { useEffect, useRef, useCallback, RefObject } from "react";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";

import { useMessages } from "./hooks/use-messages";
import { useConversation } from "./hooks/use-conversation";
import { useOrderActions } from "./hooks/use-order-actions";
import { usePageVisibility } from "@/features/chat/hooks/visibility-state";
import { MessageHeader } from "./new/message-header";
import { MessageList } from "./new/message-list";
import { OptionsPopover } from "./options/options-popover";
import { ChatModals } from "../modals/chat-modals";

import { BodyProps } from "./new/types";
import { pusherClient } from "@/lib/pusher";

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
  // Fix: Define bottomRef properly without conflicting types
  const bottomRef = useRef<HTMLDivElement>(null);
  const isVisible = usePageVisibility();

  // Store user email in sessionStorage for reference in hooks
  useEffect(() => {
    if (user?.email) {
      sessionStorage.setItem("userEmail", user.email);
    }
  }, [user?.email]);

  // Use the messages hook
  const {
    messages,
    lastMessage,
    setMessages,
    handleNewMessage,
    handleMessageUpdate,
  } = useMessages(initialMessages);

  // Use conversation hook with Pusher subscription
  const { markMessageAsSeen } = useConversation(
    conversationId,
    messages,
    handleNewMessage,
    handleMessageUpdate,
    bottomRef as RefObject<HTMLDivElement> // This ref is passed as expected
  );

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

  // Mark messages as seen when the page becomes visible
  useEffect(() => {
    if (
      isVisible &&
      messages.length > 0 &&
      messages[messages.length - 1]?.seen !== true &&
      messages[messages.length - 1]?.sender.email !== user.email
    ) {
      markMessageAsSeen();
    }
  }, [isVisible, messages, user.email, markMessageAsSeen]);

  // Subscribe to user's specific channel for conversation updates
  useEffect(() => {
    if (!user?.email) return;

    console.log(`Subscribing to user channel: ${user.email}`);

    const userChannel = pusherClient.subscribe(user.email);

    const updateHandler = (data: any) => {
      console.log("Received conversation update:", data);
      if (data.id === conversationId) {
        // Refresh the router to update the UI
        router.refresh();
      }
    };

    userChannel.bind("conversation:update", updateHandler);

    return () => {
      console.log(`Unsubscribing from user channel: ${user.email}`);
      userChannel.unbind("conversation:update", updateHandler);
      pusherClient.unsubscribe(user.email);
    };
  }, [user?.email, conversationId, router]);

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
        name={otherUser?.name || "(Deleted User)"}
        outfit={outfit}
        orderItemCount={order?.items.length}
        itemText={itemText}
        sellerRole={sellerRole}
        formattedPickupDate={formattedPickupDate}
        totalPrice={order?.totalPrice}
      />
      <div className={` pb-12 sm:pb-0`}></div>
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
      <div className="pt-48 md:pt-24" />
      <div ref={bottomRef} />{" "}
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
