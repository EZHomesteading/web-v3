import { getUserLocations } from "@/actions/getUser";
import StoreSettings from "./settings";
import authCache from "@/auth-cache";

const Page = async () => {
  const apiKey = process.env.MAPS_KEY;
  const session = await authCache();
  let locations: any[] | null = [];

  const userId = session?.user?.id;
  if (userId) {
    try {
      locations = await getUserLocations();
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  }
  return (
    apiKey && (
      <StoreSettings
        apiKey={apiKey}
        locations={locations}
        user={session?.user}
      />
    )
  );
};

export default Page;
