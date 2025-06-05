// actions/getOrderGroupWithOrders.ts

import { OrderMap } from "@/app/(nav)/checkmap/page";
import prisma from "@/lib/prisma";

export async function getOrderGroupWithOrders(ordergroupId: string) {
  try {
    const orderGroup = await prisma.orderGroup.findUnique({
      where: { id: ordergroupId },
      select: {
        id: true,
        orderIds: true,
        startLoc: true,
        endLoc: true,
      },
    });

    if (!orderGroup) return { orders: [], startLoc: [], endLoc: [] };

    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderGroup.orderIds },
      },
      select: {
        id: true,
        fulfillmentDate: true,
        location: {
          select: {
            user: { select: { name: true } },
            name: true,
            coordinates: true,
            address: true,
          },
        },
      },
    });

    const mappedOrders: OrderMap[] = orders.map((order) => ({
      id: order.id,
      pickupDate: order.fulfillmentDate || new Date(),
      name: order.location?.user.name,
      location: order.location
        ? {
          name: order.location.name || "",
          coordinates: order.location.coordinates,
          address: order.location.address,
        }
        : {
          name: "",
          coordinates: [0, 0],
          address: {
            street: "undefined",
            city: "undefined",
            state: "undefined",
            zip: "undefined",
          },
        },
    }));

    return {
      orders: mappedOrders,
      startLoc: orderGroup.startLoc,
      endLoc: orderGroup.endLoc,
    };
  } catch (error) {
    console.error("Error:", error);
    return { orders: [], startLoc: [], endLoc: [] };
  }
}
