import { Listing, Location } from "@/types";
import { string } from "zod";

declare module "chat-types" {
  export type MessageActionType =
    | "ACCEPT_TIME"
    | "PROPOSE_TIME"
    | "CONFIRM_PICKUP"
    | "MARK_READY"
    | "UPLOAD_IMAGE"
    | "DISPUTE_ORDER"
    | "ESCALATE_DISPUTE"
    | "REFUND_ORDER"
    | "COMPLETE_ORDER"
    | "CANCEL_ORDER";
  export type fulfillmentType = "DELIVERY" | "PICKUP";

  interface ListingQuantity {
    id: string;
    quantity: number;
  }
  interface MessageOption {
    icon: ReactNode;
    label: string;

    //action: MessageActionType;
    status: OrderStatus;
    onClick?: () => any;
    requiresPhoto?: boolean;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;

    validate?: () => boolean;

    data?: {
      fulfillmentDate?: Date;
      price?: number;
      reason?: string;
      images?: string[];
    };
  }

  interface MessageOptionGroup {
    title?: string;
    options: MessageOption[];
  }

  type OtherUserChat = {
    id: string;
    name: string;
    role: UserRole;
    image: string | null;
    url: string | null;
    email: string;
    stripeAccountId: string | null;
  };

  interface ChatUser {
    id: string;
    name: string;
    role: UserRole;
    email: string;
    phone: string | undefined;
    url: string | undefined;
    stripeAccountId?: string;
    location: Location[] | null;
  }
  interface TimeSlot {
    open: number;
    close: number;
  }

  interface AvailabilityDay {
    date: Date;
    capacity: number | null;
    timeSlots: TimeSlot[];
  }
  export type FullMessageType = Message & {
    sender: User;
    seen: User[];
  };

  interface Hours {
    delivery: AvailabilityDay[];
    pickup: AvailabilityDay[];
  }

  // Then update your Location type to use these interfaces:

  interface ChatMessage {
    id: string;
    body: string | null;
    image: string | null;
    createdAt: Date;
    messageOrder: string | null;
    seen: boolean;
    fee: number | null;
    sender: {
      id: string;
      name: string;
      role: UserRole;
      image: string | null;
      url: string | null;
      email: string;
      stripeAccountId: string | null;
    };
  }

  interface ChatOrder {
    id: string;
    sellerId: string;
    userId: string;
    fulfillmentType: fulfillmentType;
    fulfillmentDate: Date | null;
    totalPrice: number;
    conversationId: string | null;
    paymentIntentId: string | null;
    items: any[];
    status: OrderStatus;
    fee: {
      delivery: number | null;
      site: number | null;
      other: number[];
    } | null;
    location: Location;
  }

  interface FullChatData {
    conversation: {
      id: string;
      participantIds: string[];
      messages: ChatMessage[];
    };
    currentUser: ChatUser;
    otherUser: OtherUserChat | null;
    order: ChatOrder | null;
    listings: Listing[];
    messages: ChatMessage[];
  }
  type FullMessageType = Message & {
    sender: User;
    seen: User[];
  };

  type FullConversationType = Conversation & {
    users: User[];
    messages: FullMessageType[];
  };
}
