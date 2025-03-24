import NavbarClient from "@/components/navbar/navbar.client";
import { NavUser } from "@/actions/getUser";

interface p {
  user: NavUser | null;
  className?: string;
}

export default async function Navbar({ user, className = "bg-inherit" }: p) {
  return (
    <NavbarClient user={user} harvestMessages={[]} className={className} />
  );
}
