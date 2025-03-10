import { Basket } from "@prisma/client";
import { auth } from "@/auth";
import { authenticatedFetch } from "@/lib/api-utils";
import { headers } from "next/headers";

export default async function getActiveBaskets(): Promise<{
  baskets: Basket[];
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { baskets: [] };
    }

    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    const url = new URL(`/api/baskets/active`, `${protocol}://${host}`);
    url.searchParams.set("userId", session.user.id);

    const response = await authenticatedFetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch baskets: ${response.status}`);
    }

    const data = await response.json();
    return {
      baskets: data || [],
    };
  } catch (error) {
    console.error("[GET_ACTIVE_BASKETS]", error);
    return {
      baskets: [],
    };
  }
}
