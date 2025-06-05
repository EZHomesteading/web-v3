// app/api/basket/items/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import prisma from "@/lib/prismadb";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { listingId, quantity, status = "ACTIVE", initialOrderMethod } = body;

    if (!listingId) {
      return new NextResponse("Listing ID is required", { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        locationId: true,
        price: true,
      },
    });

    if (!listing?.locationId) {
      return new NextResponse("Listing location not found", { status: 404 });
    }

    let basketGroup = await prisma.basket.findFirst({
      where: {
        userId: user?.id,
        locationId: listing.locationId,
        status: status,
      },
      select: { id: true },
    });

    if (!basketGroup) {
      basketGroup = await prisma.basket.create({
        data: {
          userId: user?.id,
          locationId: listing.locationId,
          status: status,
          orderMethod: initialOrderMethod,
        },
        select: { id: true },
      });
    }

    const basketItem = await prisma.basketItem.create({
      data: {
        basketId: basketGroup.id,
        userId: user?.id,
        listingId,
        quantity: parseInt(quantity),
        price: listing.price,
      },
      select: {
        id: true,
        quantity: true,
      },
    });
    console.log(basketItem);
    return NextResponse.json(basketItem);
  } catch (error) {
    console.error("[WISHLIST_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const basketItems = await prisma.basketItem.findMany({
      where: {
        basket: {
          userId: user.id,
          status: "ACTIVE",
        },
      },
      select: {
        id: true,
        quantity: true,
        price: true,
        listingId: true,
        basket: {
          select: {
            locationId: true,
          },
        },
      },
    });

    return NextResponse.json(basketItems);
  } catch (error) {
    console.error("[WISHLIST_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
