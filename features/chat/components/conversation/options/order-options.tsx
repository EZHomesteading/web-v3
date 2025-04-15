import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { SheetTrigger } from "@/components/ui/sheet";
import { SheetCartC, SheetContentF } from "@/features/chat/ui/review-sheet";
import {
  HiOutlineExclamationCircle,
  HiOutlineMinusCircle,
} from "react-icons/hi";
import { PiGavel } from "react-icons/pi";
import { RiExchangeDollarLine } from "react-icons/ri";
import { MdOutlineRateReview } from "react-icons/md";
import { IoTrash } from "react-icons/io5";

interface OrderOptionsProps {
  cancel: boolean;
  dispute: boolean;
  escalate: boolean;
  refund: boolean;
  confirm: boolean;
  review: boolean;
  onOpenCancel: () => void;
  onOpenDispute: () => void;
  onOpenEscalate: () => void;
  onOpenRefund: () => void;
  onOpenConfirm: () => void;
  reviewedId?: string;
  reviewerId?: string;
  orderId?: string;
  isBuyer: boolean;
}

export const OrderOptions: React.FC<OrderOptionsProps> = memo(
  function OrderOptions({
    cancel,
    dispute,
    escalate,
    refund,
    confirm,
    review,
    onOpenCancel,
    onOpenDispute,
    onOpenEscalate,
    onOpenRefund,
    onOpenConfirm,
    reviewedId,
    reviewerId,
    orderId,
    isBuyer,
  }) {
    return (
      <div className="flex flex-col items-center justify-center space-y-1 w-full">
        {cancel && (
          <Button
            type="submit"
            onClick={onOpenCancel}
            className="w-full flex gap-x-2 items-center justify-between font-light text-sm"
          >
            <div>Cancel Order</div> <HiOutlineMinusCircle />
          </Button>
        )}

        {dispute && (
          <Button
            type="submit"
            onClick={onOpenDispute}
            className="w-full flex gap-x-2 items-center justify-between font-light text-sm"
          >
            <div>Dispute Order</div> <HiOutlineExclamationCircle />
          </Button>
        )}

        {escalate && (
          <Button
            type="submit"
            onClick={onOpenEscalate}
            className="w-full flex gap-x-2 items-center justify-between font-light text-sm"
          >
            <div>Get an Admin Involved</div> <PiGavel />
          </Button>
        )}

        {refund && (
          <Button
            type="submit"
            onClick={onOpenRefund}
            className="w-full flex gap-x-2 items-center justify-between font-light text-sm"
          >
            <div>Refund Buyer</div> <RiExchangeDollarLine />
          </Button>
        )}

        {review && (
          <SheetCartC>
            <SheetTrigger asChild>
              <Button className="w-full flex items-center gap-x-2 justify-between font-light text-sm">
                <div>Write Review</div> <MdOutlineRateReview />
              </Button>
            </SheetTrigger>
            <SheetContentF
              side="top"
              className="border-none h-screen w-screen bg-transparent  flex flex-col lg:flex-row justify-center lg:justify-evenly items-center"
              reviewedId={reviewedId}
              reviewerId={reviewerId}
              orderId={orderId}
              buyer={isBuyer}
            />
          </SheetCartC>
        )}

        {confirm && (
          <Button
            type="submit"
            onClick={onOpenConfirm}
            className="w-full flex gap-x-2 items-center justify-between font-light text-sm"
          >
            <div>Delete Chat</div> <IoTrash />
          </Button>
        )}
      </div>
    );
  }
);
