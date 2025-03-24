// app/api/locations/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { currentUser } from "@/lib/auth";

// Make sure to export the GET function
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
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      hours,
      bio,
      address,
      coordinates,
      userId: userId,
      role,
      type,
      image,
    } = body;

    let locName = body.name;
    console.log(body);
    if (!locName) {
      locName = user.name;
    }

    const requiredFields = [
      {
        key: "address",
        type: {
          street: "string",
          city: "string",
          state: "string",
          zip: "string",
        },
      },
      { key: "coordinates", type: { lat: "number", lng: "number" } },
      { key: "type", type: "string" },
      { key: "hours", type: "Hours" },
      { key: "role", type: "string" },
      { key: "userId", type: "string" },
    ];

    for (const field of requiredFields) {
      const value = body[field.key];
      if (value === undefined || value === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field.key}` },
          { status: 400 }
        );
      }

      if (typeof value !== field.type) {
        return NextResponse.json(
          {
            error: `Invalid type for field ${field.key}. Expected ${
              field.type
            }, got ${typeof value}`,
          },
          { status: 400 }
        );
      }
    }
    if (userId !== user.id) {
      return NextResponse.json(
        { error: "Status Unauthorized" },
        { status: 401 }
      );
    }
    const location = {
      name: locName,
      bio: "test",
      address,
      coordinates,
      type,
      hours,
      role,
      user: {
        connect: {
          id: user.id,
        },
      },
      ...(image !== undefined && { image }),
    };

    const newLocation = await prisma.location.create({
      data: location,
      include: {
        user: true,
      },
    });

    return NextResponse.json(newLocation);
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      {
        error: "Error creating listing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
