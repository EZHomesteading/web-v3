// File: hooks/useOrderActions.ts
import { useState, useEffect } from "react";
import { ChatMessage, ChatOrder, ChatUser } from "chat-types";

export const useOrderActions = (
  order: ChatOrder | null,
  messages: ChatMessage[],
  lastMessage: ChatMessage,
  user: ChatUser
) => {
  // Modal states
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  // Action availability states
  const [cancel, setCancel] = useState(true);
  const [dispute, setDispute] = useState(true);
  const [escalate, setEscalate] = useState(false);
  const [refund, setRefund] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [review, setReview] = useState(false);

  // Check if Cancel button should be visible
  useEffect(() => {
    if (!lastMessage) return;

    const cancelBlockingStates = [
      "BUYER_ACCEPTED",
      "PICKED_UP",
      "CANCELED",
      "REFUNDED",
      "COMPLETED",
      "IN_TRANSIT",
      "SELLER_PREPARING",
      "DISPUTED",
      "READY_FOR_PICKUP",
      "DELIVERED",
      "SCHEDULE_CONFIRMED_PAID",
      null,
    ];

    if (cancelBlockingStates.includes(lastMessage.messageOrder)) {
      setCancel(false);
    }
  }, [order, messages, lastMessage]);

  // Check if Dispute button should be visible
  useEffect(() => {
    if (!lastMessage) return;

    const disputeBlockingStates = [
      "BUYER_PROPOSED_TIME",
      "SELLER_ACCEPTED",
      "SELLER_RESCHEDULED",
      "BUYER_RESCHEDULED",
      "BUYER_ACCEPTED",
      "CANCELED",
      "REFUNDED",
      "COMPLETED",
      "IN_TRANSIT",
      "SELLER_PREPARING",
      "DISPUTED",
      "SCHEDULE_CONFIRMED_PAID",
      null,
    ];

    if (disputeBlockingStates.includes(lastMessage.messageOrder)) {
      setDispute(false);
    }
  }, [order, messages, lastMessage]);

  // Check if Escalate/Refund buttons should be visible
  useEffect(() => {
    if (!lastMessage || !order) return;

    if (lastMessage.messageOrder === "DISPUTED" && user.id === order.sellerId) {
      setRefund(true);
      setReview(true);
    }

    if (lastMessage.messageOrder === "DISPUTED") {
      setEscalate(true);
    }
  }, [order, messages, lastMessage, user.id]);

  // Check if Confirm/Review buttons should be visible
  useEffect(() => {
    if (!lastMessage) return;

    if (
      lastMessage.messageOrder === "COMPLETED" ||
      lastMessage.messageOrder === "REFUNDED" ||
      lastMessage.messageOrder === "CANCELLED"
    ) {
      setReview(true);
      setConfirm(true);
      setRefund(false);
    }
  }, [order, messages, lastMessage]);

  // Check if Review button should be visible
  useEffect(() => {
    if (!lastMessage) return;

    const reviewShowingStates = ["COMPLETED", "CANCELED", "REFUNDED", null];

    if (reviewShowingStates.includes(lastMessage.messageOrder)) {
      setReview(true);
    }
  }, [order, messages, lastMessage]);

  return {
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
  };
};
