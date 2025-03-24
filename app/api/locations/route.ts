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
    console.log(data.hours);

    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locationCount = await prisma.location.count({
      where: { userId: session.user.id },
    });

    const newLocation = await prisma.location.create({
      data: {
        userId: session.user.id,
        name: data.name,
        address: data.address,
        coordinates: data.coordinates,
        bio: data.bio,
        type: "Point",
        hours: data.hours,
        isDefault: locationCount === 0,
      },
    });

    return NextResponse.json(newLocation);
  } catch (error) {
    console.error("Detailed error in API route:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error:", error.message);
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "Unknown error",
      },
      { status: 500 }
    );
  }
}
