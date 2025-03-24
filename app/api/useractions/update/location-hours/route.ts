import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import prisma from "@/lib/prismadb";
import { Prisma, UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { address, coordinates, role, hours } = body || {};

    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let updatedLocation;

    const { locationId, isDefault } = body;

    if (locationId) {
      //console.log("Updating hours for existing location");
      updatedLocation = await prisma.location.update({
        where: { id: locationId },
        data: {
          hours,
          // name
        },
      });
    } else {
      const locationCount = await prisma.location.count({
        where: { userId: user.id },
      });

      updatedLocation = await prisma.location.create({
        data: {
          userId: user.id,
          type: "Point",
          coordinates: coordinates,
          address: address,
          role: role || UserRole.PRODUCER,
          hours: undefined,
          isDefault: locationCount === 0 || isDefault,
        },
      });
    }

    return NextResponse.json(updatedLocation);
  } catch (error) {
    console.error("Detailed error in API route:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error:", error.message);
    }
    return NextResponse.json(
      { error: "Internal server error", details: error || "Unknown error" },
      { status: 500 }
    );
  }
}
