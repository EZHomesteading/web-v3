//dashboard layout parent element
import { getNavUser, NavUser } from "@/actions/getUser";
import Navbar from "@/components/navbar/navbar.server";
import { Viewport } from "next";
export const viewport: Viewport = {
  themeColor: "#fff",
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getNavUser();
  return (
    <>
      <Navbar
        user={user as unknown as NavUser}
        className="bg-white !fixed z-1000"
      />
      <div className={`lg:pt-20 pt-2 mx-auto max-w-full pb-40`}>{children}</div>
    </>
  );
};

export default Layout;
