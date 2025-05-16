import { getNavUser } from "@/actions/getUser";

import LayoutClient from "./client-layout";
import { getConversations } from "@/features/chat/hooks/get-chat";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getNavUser();
  const conversations = await getConversations();
  const apiKey = process.env.MAPS_KEY!;
  return (
    <>
      <LayoutClient
        children={children}
        user={user}
        conversations={conversations}
        mk={apiKey}
      ></LayoutClient>
    </>
  );
};

export default Layout;
