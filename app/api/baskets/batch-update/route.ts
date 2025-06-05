// app/api/baskets/batch-update/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { updates } = await req.json();
    console.log(
      "Received batch update request with data:",
      JSON.stringify(updates, null, 2)
    );

    if (!Array.isArray(updates) || updates.length === 0) {
      console.log("Invalid updates array:", updates);
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    console.log(`Processing ${updates.length} basket updates...`);

    const results = await prisma.$transaction(
      updates.map((update) => {
        const {
          id,
          proposedLoc,
          fufillmentDate,
          timeType,
          orderMethod,
          items,
        } = update;

        console.log(`Processing basket ${id}:`, {
          proposedLoc,

          timeType,
          orderMethod,
          itemCount: items?.length,
        });

        if (!id) {
          console.error("Missing basket ID in update");
          throw new Error("Each update must include a basket ID");
        }

        return prisma.basket.update({
          where: { id },
          data: {
            proposedLoc: proposedLoc,
            fufillmentDate: fufillmentDate,
            orderMethod: orderMethod,
            items: items
              ? {
                  updateMany: items.map((item: any) => ({
                    where: { listingId: item.listingId },
                    data: { quantity: item.quantity },
                  })),
                }
              : undefined,
            timeType: timeType,
          },
        });
      })
    );

    console.log(
      "Successfully updated baskets:",
      JSON.stringify(results, null, 2)
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in batch update:", error);
    return NextResponse.json(
      {
        error: "Failed to update baskets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
