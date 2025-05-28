// app/api/basket/items/[listingId]/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import prisma from "@/lib/prismadb";

interface IParams {
  listingId: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { listingId } = params;

    if (!listingId) {
      return new NextResponse("Item ID is required", { status: 400 });
    }

    const basket = await prisma.basket.findFirst({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!basket) {
      return new NextResponse("Basket not found", { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete the basket item
      await tx.basketItem.deleteMany({
        where: {
          listingId,
          basketId: basket.id,
        },
      });

      // Check remaining items
      const remainingCount = await tx.basketItem.count({
        where: { basketId: basket.id },
      });

      if (remainingCount === 0) {
        await tx.basket.delete({
          where: { id: basket.id },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BASKET_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
