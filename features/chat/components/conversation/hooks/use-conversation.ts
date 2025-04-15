import { useEffect, useCallback } from "react";
import axios from "axios";
import { pusherClient } from "@/lib/pusher";
import { ChatMessage, FullMessageType } from "chat-types";

export const useConversation = (
  conversationId: string,
  messages: ChatMessage[],
  handleNewMessage: (message: FullMessageType) => void,
  handleMessageUpdate: (message: FullMessageType) => void,
  bottomRef: React.RefObject<HTMLDivElement>
) => {
  // Message seen status updater
  const markMessageAsSeen = useCallback(async () => {
    try {
      await axios.post(`/api/chat/conversations/${conversationId}/seen`, {
        seen: true,
      });
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  }, [conversationId]);

  // Setup Pusher subscriptions
  useEffect(() => {
    const messageHandler = async (message: FullMessageType) => {
      try {
        await axios.post(`/api/chat/conversations/${conversationId}/seen`, {
          seen: false,
        });

        handleNewMessage(message);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        console.error("Error handling new message:", error);
      }
    };

    const updateMessageHandler = (newMessage: FullMessageType) => {
      handleMessageUpdate(newMessage);

      // If updating the last message, scroll to bottom
      if (
        messages.length > 0 &&
        messages[messages.length - 1].id === newMessage.id
      ) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    pusherClient.subscribe(conversationId);
    pusherClient.bind("messages:new", messageHandler);
    pusherClient.bind("message:update", updateMessageHandler);

    // Cleanup function to unsubscribe and unbind event handlers
    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind("messages:new", messageHandler);
      pusherClient.unbind("message:update", updateMessageHandler);
    };
  }, [
    conversationId,
    messages,
    handleNewMessage,
    handleMessageUpdate,
    bottomRef,
  ]);

  return { markMessageAsSeen };
};
