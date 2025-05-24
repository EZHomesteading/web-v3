"use client";
import { OutfitFont } from "@/components/fonts";

import FindListingsComponent from "./market/ui/search-listings";
import Logo from "@/components/navbar/Logo";
import UserMenu from "@/components/navbar/menu";
import { NavUser } from "@/actions/getUser";
import ConversationList from "@/features/chat/components/list/conversation-list";
import { FullConversationType } from "chat-types";
import NavbarClient from "@/components/navbar/navbar.client";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

// Utility function to get theme color
export function getThemeColor(pathname: string): string {
  const baseRoute = pathname?.split("/")[1] || "";

  const themeColorMap: { [key: string]: string } = {
    "": "#fff",
    "get-ezh-app": "#fff",
    checkout: "#fff",
    "info-modals": "#fff",
    map: "#fff",
    "my-basket": "#fff",
    profile: "#fff",
    store: "#fff",
    market: "#fff",
    account: "#CED9BB",
    selling: "#CED9BB",
    chat: "rgb(241 239 231)",
  };

  return themeColorMap[baseRoute] || "#fff";
}

// Client-side viewport hook
export function useViewport() {
  const pathname = usePathname();

  // Generate viewport metadata dynamically
  const viewport = useMemo(() => {
    return {
      themeColor: getThemeColor(pathname || ""),
      // Add other viewport configurations as needed
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    };
  }, [pathname]);

  return viewport;
}

// Meta component to update viewport
export function ViewportMeta() {
  const viewport = useViewport();

  // Update meta tags client-side
  useMemo(() => {
    if (typeof document !== "undefined") {
      // Update theme-color meta tag
      let themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeColorMeta) {
        themeColorMeta = document.createElement("meta");
        themeColorMeta.setAttribute("name", "theme-color");
        document.head.appendChild(themeColorMeta);
      }
      themeColorMeta.setAttribute("content", viewport.themeColor);

      // Update viewport meta tag
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement("meta");
        viewportMeta.setAttribute("name", "viewport");
        document.head.appendChild(viewportMeta);
      }
      viewportMeta.setAttribute(
        "content",
        `width=${viewport.width}, initial-scale=${viewport.initialScale}, maximum-scale=${viewport.maximumScale}, user-scalable=no`
      );
    }
  }, [viewport]);

  // No visible render
  return null;
}
const LayoutClient = ({
  children,
  user,
  conversations,
  mk,
}: {
  children: React.ReactNode;
  user: NavUser | null;
  conversations: FullConversationType;
  mk: string;
}) => {
  const pathname = usePathname();

  // Extract the base route (first segment)
  const baseRoute = pathname?.split("/")[1] || "";
  // Route styles logic inside the component
  function getRouteStyles(): string {
    switch (baseRoute) {
      case "":
        return "w-full md:pt-20 pt-2";
      case "get-ezh-app":
      case "checkout":
      case "info-modals":
      case "checkmap":
        return "h-[calc(100vh-64px)] fixed overflow-hidden w-full  md:mt-20  overscroll-y-none";
      case "map":
        return "h-[calc(100vh-64px)] fixed overflow-hidden w-full  md:mt-20  overscroll-y-none";
      case "my-basket":
      case "profile":
      case "store":
        return "md:pt-20 pt-2 mx-auto max-w-full pb-40";

      case "account":
      case "selling":
        return "sheet min-h-screen overflow-y-auto";
      case "chat":
        return "sm:pt-16 md:pt-32";

      default:
        return "";
    }
  }

  const routeClassName = getRouteStyles();

  return (
    <>
      <ViewportMeta />
      {baseRoute === "market" ? (
        <>
          {" "}
          <div
            className={`fixed bottom-0 left-0 right-0 lg:top-0 border-t lg:border-t-none border-custom p-2 z-1 w-screen h-20 bg-white z-navigation ${OutfitFont.className}`}
          >
            <div
              className={`flex items-center justify-evenly lg:justify-between w-full px-4 h-fit`}
            >
              <div className={`hidden lg:block max-w-[25%] w-full`}>
                <Logo />
              </div>
              <div
                className={`fixed h-20 lg:h-fit  top-1 pt-2 lg:pt-0 w-full lg:w-[40%] bg-inherit px-2 bg-white mx-auto lg:absolute`}
              >
                <FindListingsComponent apiKey={mk} />
              </div>
              <div
                className={`flex items-center w-full justify-evenly lg:justify-end gap-x-3 lg:pt-2`}
              >
                <UserMenu user={user} harvestMessages={[]} />
              </div>
            </div>
          </div>
          <div className={`z-content`}>{children}</div>
        </>
      ) : (
        <>
          <NavbarClient user={user} harvestMessages={[]} />
          <div className={`${OutfitFont.className} ${routeClassName}`}>
            {baseRoute === "chat" && (
              <ConversationList
                title="Messages"
                initialItems={
                  conversations.conversations as unknown as FullConversationType[]
                }
                user={conversations.user}
              />
            )}
            {children}
          </div>
        </>
      )}
    </>
  );
};

export default LayoutClient;
