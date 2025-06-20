"use client";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getStatusText } from "./notification-order-status";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FaComment } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { PiBellThin } from "react-icons/pi";
import { navBuyOrder, navSellOrder } from "order-types";
import { OutfitFont } from "@/components/fonts";

interface Props {
  bOrders?: navBuyOrder[];
  sOrders?: navSellOrder[];
  harvestMessages:
    | {
        conversationId: string;
        lastMessageAt: Date;
      }[]
    | undefined;
}

const NotificationIcon = ({ bOrders, sOrders, harvestMessages }: Props) => {
  const pathname = usePathname();
  const white = pathname === "/" || pathname?.startsWith("/chat");
  const notifications: {
    text: string;
    conversationId: string;
    updatedAt: Date;
  }[] = [];

  if (bOrders) {
    bOrders.forEach((order: navBuyOrder) => {
      const statusText = getStatusText(
        order.status,
        false,
        order.seller?.name || "(Deleted User)",
        order.buyer?.name || "(Deleted User)"
      );
      if (statusText !== "") {
        notifications.push({
          text: statusText,
          conversationId: order.conversationId || "",
          updatedAt: order.updatedAt,
        });
      }
    });
  }

  if (sOrders) {
    sOrders.forEach((order: navSellOrder) => {
      const statusText = getStatusText(
        order.status,
        true,
        order.seller?.name || "(Deleted User)",
        order.buyer?.name || "(Deleted User)"
      );
      if (statusText !== "") {
        notifications.push({
          text: statusText,
          conversationId: order.conversationId || "",
          updatedAt: order.updatedAt,
        });
      }
    });
  }
  if (harvestMessages) {
    harvestMessages.forEach(
      (convo: { conversationId: string; lastMessageAt: Date }) => {
        notifications.push({
          text: "You have a message regarding a Projected Harvest Listing",
          conversationId: convo.conversationId,
          updatedAt: convo.lastMessageAt,
        });
      }
    );
  }
  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <Sheet>
        <SheetTrigger className="pb-2 hover:cursor-pointer relative flex flex-col items-center">
          <PiBellThin className={`h-8 w-8  bell-icon`} />
          <div
            className={`${OutfitFont.className} absolute -top-1 -right-1 rounded-full bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center`}
          >
            {notifications.length}
          </div>

          <div
            className={`text-xs pb-2 font-medium sm:pb-0 ${OutfitFont.className}`}
          >
            Alerts
          </div>
        </SheetTrigger>

        <SheetContent className="pt-12 bg-slate-500 opacity-border-none justify-start flex flex-col gap-y-1 border-none overflow-y-auto z-9999">
          <SheetTitle className="pl-10 pt-1  border-neutral-200 border-b-[1px] ">
            <div className="absolute top-4 right-10">Chat Notifications</div>
          </SheetTitle>
          {notifications.map((notification, index) => (
            <Link
              key={index}
              className="relative hover:opacity-60"
              href={`/chat/${notification.conversationId}`}
            >
              <SheetTrigger
                className={`${OutfitFont.className} border-neutral-200 border-b-[1px] min-w-full`}
              >
                <div className="relative">
                  <div className="flex justify-start items-center text-start text-white bg-slate-500 pl-2 py-3">
                    <FaComment className="h-6 w-6 mr-2 text-slate-200 flex-shrink-0" />
                    <div>
                      <span className="absolute top-0 right-2 text-xs text-gray-200">
                        {formatDistanceToNow(new Date(notification.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {notification.text}
                    </div>
                  </div>
                </div>
              </SheetTrigger>
            </Link>
          ))}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default NotificationIcon;
