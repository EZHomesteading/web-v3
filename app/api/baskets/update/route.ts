import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const {
    id,
    proposedLoc,
    deliveryDate,
    pickupDate,
    timeType,
    orderMethod,
    items,
  } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }
  console.log(req);
  try {
    const updatedBasket = await prisma.basket.update({
      where: { id },
      data: {
        proposedLoc: proposedLoc,

        fulfillmentDate: pickupDate
          ? new Date(pickupDate)
          : deliveryDate
          ? new Date(deliveryDate)
          : null,
        orderMethod: orderMethod,
        items: {
          updateMany: items.map((item: any) => ({
            where: { listingId: item.listingId },
            data: { quantity: item.quantity },
          })),
        },
        timeType: timeType,
      },
    });
    return NextResponse.json(updatedBasket);
  } catch (error) {
    console.error("Error updating basket:", error);
    return NextResponse.json(
      { error: "Failed to update basket" },
      { status: 500 }
    );
  }
}
