// actions/getLocations.ts
import { auth } from "@/auth";
import { authenticatedFetch } from "@/lib/api-utils";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Location } from "@prisma/client";

async function getLocationsById(locationIds: string[]): Promise<{
  locations: Location[];
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log("No session found");
      return { locations: [] };
    }

    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    const url = new URL(`/api/locations`, `${protocol}://${host}`);
    url.searchParams.set("ids", locationIds.join(","));

    const response = await authenticatedFetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.status}`);
    }

    const data = await response.json();
    return {
      locations: data || [],
    };
  } catch (error) {
    console.error("[GET_LOCATIONS_BY_ID]", error);
    return {
      locations: [],
    };
  }
}

const getUserLocations = async ({
  userId,
}: {
  userId?: string;
}): Promise<Location[] | null> => {
  if (!userId) {
    return null;
  }

  try {
    const locations = await prisma.location.findMany({
      where: {
        userId: userId,
      },
    });

    if (!locations) {
      return null;
    }

    return locations;
  } catch (error) {
    return [];
  }
};

export { getLocationsById, getUserLocations };
