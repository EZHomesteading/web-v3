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
    if (!conversationId) return;

    console.log(`Subscribing to Pusher channel: ${conversationId}`);

    const messageHandler = async (message: FullMessageType) => {
      console.log("Received new message via Pusher:", message);
      try {
        // Mark the message as seen if it's not from the current user
        if (message.sender.email !== sessionStorage.getItem("userEmail")) {
          await axios.post(`/api/chat/conversations/${conversationId}/seen`, {
            seen: true,
          });
        }

        handleNewMessage(message);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          window.scrollBy({ top: 100, behavior: "smooth" });
        }, 800);
      } catch (error) {
        console.error("Error handling new message:", error);
      }
    };

    const updateMessageHandler = (newMessage: FullMessageType) => {
      console.log("Received message update via Pusher:", newMessage);
      handleMessageUpdate(newMessage);

      // If updating the last message, scroll to bottom
      if (
        messages.length > 0 &&
        messages[messages.length - 1].id === newMessage.id
      ) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Subscribe to the channel
    const channel = pusherClient.subscribe(conversationId);

    // Bind event handlers
    channel.bind("messages:new", messageHandler);
    channel.bind("message:update", updateMessageHandler);

    // Cleanup function to unsubscribe and unbind event handlers
    return () => {
      console.log(`Unsubscribing from Pusher channel: ${conversationId}`);
      channel.unbind("messages:new", messageHandler);
      channel.unbind("message:update", updateMessageHandler);
      pusherClient.unsubscribe(conversationId);
    };
  }, [
    conversationId,
    handleNewMessage,
    handleMessageUpdate,
    bottomRef,
    // Remove messages from dependency array to prevent unnecessary resubscriptions
  ]);

  return { markMessageAsSeen };
};
