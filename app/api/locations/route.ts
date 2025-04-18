import prisma from "@/lib/prisma";
import { z } from "zod";
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
        { status: 400 },
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

<<<<<<< HEAD
const NewStoreReq = z.object({
  userId: z.string(),
  name: z.string(),
  bio: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string().optional(),
  }),
  coordinates: z.array(z.number(), z.number()),
  role: z.string(),
  hours: z.object({
    delivery: z.array(z.any()).optional(),
    pickup: z.array(z.any()).optional(),
  }),
  type: z.string(),
  isDefault: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const validationResult = NewStoreReq.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const newLocation = await prisma.location.create({
      data: body,
    });

    return NextResponse.json({
      store: newLocation,
      message: "New store created sucessfully",
    });
  } catch (error) {
    console.error("[LOCATIONS_POST]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
=======
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
>>>>>>> main
    );
  }
}
