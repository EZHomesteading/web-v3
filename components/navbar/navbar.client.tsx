"use client";
import UserMenu from "./menu";
import { NavUser } from "@/actions/getUser";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface NavbarProps {
  user: NavUser | null;

  harvestMessages:
    | {
        conversationId: string;
        lastMessageAt: Date;
      }[]
    | undefined;
}

const Navbar = ({ user, harvestMessages }: NavbarProps) => {
  function useRouteStyles(): string {
    const pathname = usePathname();

    // Extract the base route (first segment)
    const baseRoute = pathname?.split("/")[1] || "";

    // Switch statement to determine class based on route
    switch (baseRoute) {
      case "":
      case "get-ezh-app":
      case "checkout":
      case "info-modals":
      case "map":
      case "my-basket":
      case "profile":
      case "store":
        return "bg-white !fixed z-1000";

      case "account":
      case "selling":
        return "sheet zmax md:h-20 h-24 border-t-none";
      case "chat":
        return "z-9999 bg-[#F1EFE7] ";

      default:
        return "";
    }
  }
  const routeClassName = useRouteStyles();
  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 md:top-0 border-t py-3 z-1 w-screen h-20",

          routeClassName
        )}
      >
        <div
          className={`flex items-center justify-evenly md:justify-between w-full px-4 h-fit`}
        >
          <Logo />
          <div
            className={`flex items-center w-full justify-evenly md:justify-end gap-x-3`}
          >
            <UserMenu
              user={user}
              // uniqueUrl={uniqueUrl}
              harvestMessages={harvestMessages}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
