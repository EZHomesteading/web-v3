import Body from "@/features/chat/components/conversation/Body";
import EmptyState from "@/components/EmptyState";
import { redirect } from "next/navigation";
import { getFullChatData } from "@/features/chat/hooks/get-full-chat-data";
import { getOrderGroupIdByOrderId } from "@/actions/getOrderGroupByOrderId";

interface IParams {
  conversationId: string;
}

const ChatId = async ({
  params,
  searchParams,
}: {
  params: IParams;
  searchParams: { redirect_status?: string; payment_intent?: string };
}) => {
  // If there's a successful payment, redirect to the clean URL
  params = await params;
  searchParams = await searchParams;
  if (searchParams.redirect_status === "succeeded") {
    redirect(`/chat/${params.conversationId}`);
  }

  const chatData = await getFullChatData(params.conversationId);
  if (!chatData) {
    return <EmptyState />;
  }

  const { conversation, currentUser, otherUser, order, listings, messages } =
    chatData;

  if (
    !conversation.participantIds.includes(currentUser.id) &&
    currentUser.role !== "ADMIN"
  ) {
    redirect("/chat");
  }
  let orderGroupId = order?.id
    ? await getOrderGroupIdByOrderId(order.id)
    : null;

  const messagesWithListings = messages.map((message: any) => {
    if (message.listingId) {
      const listing = listings.find((l: any) => l.id === message.listingId);
      return { ...message, listing };
    }
    return message;
  });

  return (
    <div className="chat-layout lg:pl-80">
      <Body
        initialMessages={messages}
        adminMessages={messagesWithListings}
        orderGroupId={orderGroupId}
        user={currentUser}
        otherUser={otherUser}
        order={order}
        conversationId={params.conversationId}
        listings={listings}
      />
    </div>
  );
};

export default ChatId;
