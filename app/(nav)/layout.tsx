import { getNavUser } from "@/actions/getUser";

import LayoutClient from "./client-layout";
import { getConversations } from "@/features/chat/hooks/get-chat";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getNavUser();
  const conversations = await getConversations();
  return (
    <>
      <LayoutClient
        children={children}
        user={user}
        conversations={conversations}
      ></LayoutClient>
    </>
  );
};

export default Layout;
