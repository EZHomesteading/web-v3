// get & delete route for /baskets/[id]
import prisma from "@/lib/prisma";
import { Basket_ID_Page } from "@/features/basket/types/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request
): Promise<Basket_ID_Page | NextResponse> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("userId");
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const basketGroup = await prisma.basket.findUnique({
      where: { id },
      select: {
        userId: true,
      },
    });
    if (!basketGroup) {
      return NextResponse.json({ error: "Basket not found" }, { status: 404 });
    }

    if (basketGroup.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to basket" },
        { status: 403 }
      );
    }

    const fullBasketGroup = await prisma.basket.findUnique({
      where: { id },
      select: {
        id: true,
        proposedLoc: true,
        // fufillmentDate: true,
        items: {
          select: {
            quantity: true,
            price: true,
            listing: {
              select: {
                id: true,
                title: true,
                unit: true,
                images: true,
                stock: true,
                price: true,
                SODT: true,
                subcategory: true,
                minOrder: true,
                shelfLife: true,
                rating: true,
                createdAt: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            SODT: true,
            name: true,
            image: true,
            type: true,
            coordinates: true,
            address: true,
            hours: true,
            role: true,
            user: {
              select: {
                id: true,
                url: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });
    if (fullBasketGroup?.location?.hours) {
      const hours = fullBasketGroup.location.hours as any;

      if (hours.pickup) {
        hours.pickup.sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }

      if (hours.delivery) {
        hours.delivery.sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }
    }
    return NextResponse.json(fullBasketGroup);
  } catch (error) {
    console.log(error, "error in /ezhomesteading-web/app/api/baskets/get/unique/route.ts")
    return NextResponse.json(
      { error: "Failed to fetch basket" },
      { status: 500 }
    );
  }
}
