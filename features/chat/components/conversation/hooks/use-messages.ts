// File: hooks/useMessages.ts
import { useState, useCallback } from "react";

import { ChatMessage, FullMessageType } from "chat-types";

export const useMessages = (initialMessages: ChatMessage[]) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const lastMessage = messages[messages.length - 1];

  // Handle new message from Pusher
  const handleNewMessage = useCallback((message: FullMessageType) => {
    setMessages((prevMessages) => {
      return [...prevMessages, message];
    });
  }, []);

  // Handle message update from Pusher
  const handleMessageUpdate = useCallback((updatedMessage: FullMessageType) => {
    setMessages((prevMessages) =>
      prevMessages.map((currentMessage) => {
        if (currentMessage.id === updatedMessage.id) {
          return updatedMessage;
        }
        return currentMessage;
      })
    );
  }, []);

  return {
    messages,
    lastMessage,
    setMessages,
    handleNewMessage,
    handleMessageUpdate,
  };
};
