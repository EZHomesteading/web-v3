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
        { status: 400 }
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
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
