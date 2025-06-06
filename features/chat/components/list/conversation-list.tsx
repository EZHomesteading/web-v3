"use client";
import { useEffect, useCallback, useMemo, useState, ReactElement } from "react";
import clsx from "clsx";
import type { FullConversationType, FullMessageType } from "chat-types";
import useConversation from "@/features/chat/hooks/use-conversation";
import SubToggle from "../ui/notification-button";
import { registerServiceWorker } from "@/features/chat/services/use-service-worker";
import {
  getCurrentPushSubscription,
  sendPushSubscriptionToServer,
} from "@/features/chat/services/push-service";
import axios from "axios";
import type { UserInfo } from "next-auth";
import { OutfitFont } from "@/components/fonts";
import { usePathname, useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import Avatar from "../../../../components/Avatar";
import useOtherUser from "@/features/chat/hooks/use-other-user";
import { IoNotificationsCircle } from "react-icons/io5";
import { format } from "date-fns";

interface ConversationListProps {
  initialItems: FullConversationType[];
  title?: string;
  user?: UserInfo | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  initialItems,
  user,
}): ReactElement => {
  const items = initialItems;
  const pathname = usePathname();
  const pathSegments = pathname?.split("/").filter(Boolean) || [];
  const hasId = pathSegments.length > 1;
  const { conversationId, isOpen } = useConversation();

  useEffect(() => {
    async function setUpServiceWorker(): Promise<void> {
      try {
        await registerServiceWorker();
        if (!user?.subscriptions)
          await axios.post("/api/useractions/update", {
            subscriptions: "[]",
          });
      } catch (error) {
        console.error(error);
      }
    }
    setUpServiceWorker();

    // No cleanup needed for this one-time setup
  }, [user?.subscriptions]);

  useEffect(() => {
    async function syncPushSubscription(): Promise<void> {
      try {
        const subscription = await getCurrentPushSubscription();
        if (subscription) {
          await sendPushSubscriptionToServer(subscription);
        }
      } catch (error) {
        console.error(error);
      }
    }
    syncPushSubscription();

    // No cleanup needed for this one-time sync
  }, []);

  return (
    <>
      <aside
        className={clsx(
          `fixed inset-y-6 md:inset-y-20 overflow-auto w-full pb-20 md:pb-0 md:w-80 border-r-[1px]`,
          isOpen ? "block left-0" : "",
          hasId ? "hidden lg:block" : ""
        )}
      >
        <div className="">
          <div className="flex ml-5 mb-4 items-center justify-between">
            <div className={`${OutfitFont.className} text-2xl font-medium`}>
              Messages
            </div>
            <SubToggle />
          </div>

          {items.map((item) => (
            <ConversationBox
              key={item.id}
              data={item}
              user={user}
              selected={conversationId === item.id}
            />
          ))}
        </div>
      </aside>
    </>
  );
};

interface ConversationBoxProps {
  data: FullConversationType;
  selected?: boolean;
  user?: UserInfo | null | undefined;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({
  data,
  selected,
  user,
}): ReactElement => {
  const [conversation, setConversation] = useState<FullConversationType>(data);
  const otherUser = useOtherUser(conversation);
  const router = useRouter();

  useEffect(() => {
    setConversation(data);
  }, [data]);

  useEffect(() => {
    const newHandler = (message: FullMessageType): void => {
      if (message.conversationId === conversation.id) {
        setConversation((current: any) => ({
          ...current,
          messages: [...current.messages, message],
          lastMessageAt: new Date(message.createdAt),
        }));
      }
    };

    const updateHandler = (message: FullMessageType): void => {
      if (message.conversationId === conversation.id) {
        setConversation((current: any) => ({
          ...current,
          messages: current.messages.map((currentMessage: any) =>
            currentMessage.id === message.id ? message : currentMessage
          ),
        }));
      }
    };

    pusherClient.subscribe(conversation.id);
    pusherClient.bind("messages:new", newHandler);
    pusherClient.bind("message:update", updateHandler);

    return () => {
      pusherClient.unsubscribe(conversation.id);
      pusherClient.unbind("messages:new", newHandler);
      pusherClient.unbind("message:update", updateHandler);
    };
  }, [conversation.id]);

  const handleClick = useCallback((): void => {
    router.push(`/chat/${conversation.id}`);
  }, [conversation.id, router]);

  const lastMessage = useMemo(() => {
    const messages = conversation.messages || [];
    return messages[messages.length - 1];
  }, [conversation.messages]);

  const userEmail = useMemo(() => user?.email, [user?.email]);
  const isOwn = user?.email === lastMessage?.sender?.email;
  const notOwn = !isOwn;

  const hasSeen = useMemo(() => {
    if (!lastMessage || !userEmail) return false;
    return lastMessage.seen;
  }, [userEmail, lastMessage]);

  // Refactor nested ternaries for better readability
  const showNotificationBadge = (): boolean => {
    if (notOwn && lastMessage?.messageOrder !== "SELLER_ACCEPTED") {
      return true;
    }
    if (isOwn && lastMessage?.messageOrder === "SELLER_ACCEPTED") {
      return true;
    }
    return false;
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        `w-full relative flex items-center space-x-3 p-3`,
        selected ? "" : "hover:cursor-pointer",
        hasSeen || isOwn ? "bg-slate-100" : ""
      )}
    >
      <Avatar image={otherUser?.image} />

      <div className={`${OutfitFont.className} min-w-0 flex-1`}>
        <div className="focus:outline-none">
          <span className="absolute inset-0" />
          {showNotificationBadge() ? (
            <span
              className="bg-white w-3 h-3 rounded-[40px] absolute left-[40px] top-[43px] md:left-[50px] md:top-[45px] group"
              aria-label="Your turn to respond"
            >
              <IoNotificationsCircle
                color="green"
                className="absolute right-[-5px] top-[-3px]"
                size={20}
              />
              <span className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 left-0 top-full mt-1 whitespace-nowrap z-10">
                Your turn to respond
              </span>
            </span>
          ) : null}
          <div className="flex justify-between items-center mb-1">
            <p className="text-md font-normal">{otherUser?.name}</p>

            {lastMessage?.createdAt && (
              <p className="text-xs text-gray-400 font-extralight">
                {format(new Date(lastMessage.createdAt), "p")}
              </p>
            )}
          </div>
          <p
            className={clsx(
              `truncate text-sm font-thin`,
              hasSeen ? "text-gray-500" : "text-black font-medium"
            )}
          >
            {lastMessage?.body}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationList;
