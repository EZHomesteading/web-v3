//server side page layout for the homepage
import { UserRole } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { getUserById } from "@/utils/user";
import AdminHome from "./admin-home";
import Home from "./home";

const HomePage = async () => {
  const user = await currentUser();
  let fullUser: any = user;
  if (user) {
    fullUser = await getUserById(user.id);
  }

  return (
    <>
      {user && user.role === UserRole.ADMIN ? (
        <AdminHome user={user} />
      ) : (
        <Home user={fullUser} />
      )}
    </>
  );
};

export default HomePage;
