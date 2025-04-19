import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json(
      { error: "Location ID is required" },
      { status: 400 }
    );
  }

  try {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    return NextResponse.json({ location });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { location, locationId } = data;

  try {
    // With MongoDB, you need to update the hours field directly
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        hours: {
          delivery: location[0].hours.delivery,
          pickup: location[0].hours.pickup,
        },
      },
    });

    return NextResponse.json({ success: true, location: updatedLocation });
  } catch (error) {
    console.error("Error updating hours:", error);
    return NextResponse.json(
      { error: "Failed to update hours" },
      { status: 500 }
    );
  }
}
