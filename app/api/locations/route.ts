import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locationIds = searchParams.get("ids")?.split(",") || [];

    if (!locationIds.length) {
      return NextResponse.json(
        { error: "No location IDs provided" },
        { status: 400 }
      );
    }

    const locations = await prisma.location.findMany({
      where: {
        id: {
          in: locationIds,
        },
      },
      select: {
        id: true,
        name: true,
        coordinates: true,
        address: true,
        hours: true,
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("[LOCATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body.data;

    // Debug all the data we're receiving
    console.log("Full request data:", JSON.stringify(data, null, 2));
    console.log("Hours structure:", JSON.stringify(data.hours, null, 2));
    console.log("Coordinates:", JSON.stringify(data.coordinates, null, 2));

    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locationCount = await prisma.location.count({
      where: { userId: session.user.id },
    });

    // Create a complete data object with all fields explicitly defined
    const locationData = {
      userId: session.user.id,
      name: data.name || "Unset Location Name",
      address: data.address,
      coordinates: data.coordinates,
      bio: data.bio || "",
      type: data.type,
      role: data.role || "PRODUCER",
      isDefault: locationCount === 0,
      hours: data.hours,
    };

    // Only add hours if it exists and is properly formatted
    if (
      data.hours &&
      Array.isArray(data.hours.pickup) &&
      Array.isArray(data.hours.delivery)
    ) {
      locationData.hours = {
        pickup: data.hours.pickup,
        delivery: data.hours.delivery,
      };
    }

    console.log(
      "Data being sent to Prisma:",
      JSON.stringify(locationData, null, 2)
    );

    const newLocation = await prisma.location.create({
      data: locationData,
    });

    return NextResponse.json(newLocation);
  } catch (error) {
    console.error("Detailed error in API route:", error);
    // If there's a stack trace, log it
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error message:", error.message);
      console.error("Prisma error meta:", error.meta);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
