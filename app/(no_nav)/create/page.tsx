import CreateClient from "@/features/create/components/main/create.client";
import type { Viewport } from "next";
import CreatePopup from "@/app/(nav)/info-modals/create-info-modal";
import { getUserLocations } from "@/actions/getLocations";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const viewport: Viewport = {
  themeColor: "#fff",
};

const Page = async ({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) => {
  const resolvedparams = await searchParams;
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  let locations = await getUserLocations({ userId: session?.user?.id });

  locations = locations?.filter((loc) => loc.role !== UserRole.CONSUMER); // i hate javascript

  const defaultLocation = locations?.find(
    (loc) => loc?.id === resolvedparams?.id && loc.role !== UserRole.CONSUMER
  );

  return (
    <>
      <CreateClient
        user={session?.user}
        locations={locations}
        defaultLocation={defaultLocation}
      />
      <CreatePopup />
    </>
  );
};
export default Page;
