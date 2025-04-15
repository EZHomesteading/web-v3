// File: modals/chat-modals.tsx
import React, { memo } from "react";
import CancelModal from "../modals/cancel-modal";
import ConfirmModal from "../modals/confirm-modal";
import DisputeModal from "../modals/dispute-modal";
import EscalateModal from "../modals/escalate-modal";
import RefundModal from "../modals/refund-modal";
import { ChatModalsProps } from "../conversation/new/types";

export const ChatModals: React.FC<ChatModalsProps> = memo(function ChatModals({
  orderGroupId,
  cancelOpen,
  confirmOpen,
  disputeOpen,
  escalateOpen,
  refundOpen,
  onCloseCancel,
  onCloseConfirm,
  onCloseDispute,
  onCloseEscalate,
  onCloseRefund,
  order,
  otherUser,
  user,
  isSeller,
}) {
  return (
    <div className="z-1000">
      <CancelModal
        orderGroupId={orderGroupId}
        isOpen={cancelOpen}
        onClose={onCloseCancel}
        order={order}
        otherUser={otherUser?.id}
        convoId={order?.conversationId}
        otherUserRole={otherUser?.role}
        isSeller={isSeller}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        orderId={order?.id}
        onClose={onCloseConfirm}
      />

      <DisputeModal
        isOpen={disputeOpen}
        onClose={onCloseDispute}
        user={user}
        orderId={order?.id}
        conversationId={order?.conversationId}
        otherUserId={otherUser?.id}
      />

      <EscalateModal
        isOpen={escalateOpen}
        onClose={onCloseEscalate}
        orderId={order?.id}
      />

      <RefundModal
        orderGroupId={orderGroupId}
        isOpen={refundOpen}
        onClose={onCloseRefund}
        orderId={order?.id}
        orderAmount={order?.totalPrice}
        conversationId={order?.conversationId}
        otherUserId={otherUser?.id}
        paymentId={order?.paymentIntentId}
      />
    </div>
  );
});
