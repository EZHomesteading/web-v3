// File: types.ts
import { ChatMessage, ChatOrder, ChatUser, OtherUserChat } from "chat-types";

export interface BodyProps {
  initialMessages: ChatMessage[];
  adminMessages: MessageWithListing[];
  otherUser: OtherUserChat | null;
  order: ChatOrder | null;
  user: ChatUser;
  conversationId: string;
  orderGroupId: string | null;
  listings: Listing[];
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  unit: string;
  images: string[];
}

export interface MessageWithListing {
  listing: {
    id: string;
    SODT: number | null;
    title: string;
    category: string;
    subcateory: string;
    stock: number;
    unit: string;
    price: number;
    description: string;
    projectedStock: number | null;
    harvestFeatures: boolean | null;
    harvestDates: string[];
    tags: string[];
    minOrder: number;
    images: string[];
    review: boolean | null;
    harvestType: string | null;
    reports: number | null;
    shelfLife: number;
    locationId: string | null;
    rating: number[];
    userId: string;
    createdAt: Date;
    emailList: { list: string[] } | null;
    smsList: { list: string[] } | null;
  } | null;
}

export interface MessageHeaderProps {
  outfit: any;
  orderItemCount?: number;
  itemText: string;
  sellerRole?: string;
  formattedPickupDate: string;
  totalPrice?: number;
}

export interface MessageListProps {
  messages: ChatMessage[];
  adminMessages: MessageWithListing[];
  orderGroupId: string | null;
  listings: Listing[];
  user: ChatUser;
  conversationId: string;
  otherUser: OtherUserChat | null;
  order: ChatOrder | null;
}

export interface OptionsPopoverProps {
  outfit: any;
  listings: Listing[];
  order: ChatOrder | null;
  otherUser: OtherUserChat | null;
  user: ChatUser;
  orderGroupId: string | null;
  router: any;
  lastMessage: ChatMessage;
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
}

export interface ChatModalsProps {
  orderGroupId: string | null;
  cancelOpen: boolean;
  confirmOpen: boolean;
  disputeOpen: boolean;
  escalateOpen: boolean;
  refundOpen: boolean;
  onCloseCancel: () => void;
  onCloseConfirm: () => void;
  onCloseDispute: () => void;
  onCloseEscalate: () => void;
  onCloseRefund: () => void;
  order: ChatOrder | null;
  otherUser: OtherUserChat | null;
  user: ChatUser;
  isSeller: boolean;
}
