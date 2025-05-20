import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    const locVendor = await prisma.location.findUnique({
      where: { id: id as string },
      select: {
        address: { select: { zip: true } },
        name: true,
        listings: {
          select: {
            images: true,
          },
          take: 5,
        },
        user: {
          select: {
            name: true,
            image: true,
            fullName: {
              select: {
                first: true,
              },
            },
            url: true,
          },
        },
      },
    });

    if (!locVendor) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(locVendor);
  } catch (error) {
    console.error("Error fetching marker info:", error);
    return NextResponse.json(
      { error: "Error fetching marker info" },
      { status: 500 }
    );
  }
}
