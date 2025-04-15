// File: message-list.tsx
import React, { memo } from "react";
import MessageBox from "../message-box";
import { MessageListProps } from "./types";

export const MessageList: React.FC<MessageListProps> = memo(
  function MessageList({
    messages,
    adminMessages,
    orderGroupId,
    listings,
    user,
    conversationId,
    otherUser,
    order,
  }) {
    return (
      <>
        {messages.map((message, i) => (
          <MessageBox
            messagesLength={messages.length}
            listing={
              message.messageOrder === "HARVEST"
                ? adminMessages[i]?.listing
                : null
            }
            orderGroupId={orderGroupId}
            listings={listings}
            isLast={i === messages.length - 1}
            key={message.id}
            data={message}
            user={user}
            convoId={conversationId}
            otherUsersId={otherUser?.id}
            order={order}
            otherUserRole={otherUser?.role}
            stripeAccountId={otherUser?.stripeAccountId}
          />
        ))}
      </>
    );
  }
);
