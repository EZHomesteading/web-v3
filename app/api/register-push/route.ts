import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import prisma from "@/lib/prismadb";
import { PushSubscription } from "web-push";

// Validate push subscription structure
function isValidPushSubscription(
  subscription: any
): subscription is PushSubscription {
  return (
    subscription &&
    typeof subscription.endpoint === "string" &&
    subscription.endpoint.length > 0 &&
    subscription.keys &&
    typeof subscription.keys.p256dh === "string" &&
    typeof subscription.keys.auth === "string"
  );
}

// Clean up expired or invalid subscriptions
function cleanupSubscriptions(
  subscriptions: PushSubscription[]
): PushSubscription[] {
  return subscriptions.filter((sub) => {
    // Basic validation
    if (!isValidPushSubscription(sub)) {
      console.log("Removing invalid subscription structure:", sub);
      return false;
    }

    // Check for obviously expired FCM endpoints (optional additional validation)
    try {
      const url = new URL(sub.endpoint);
      // Valid FCM endpoints should have proper structure
      if (
        url.hostname === "fcm.googleapis.com" &&
        !sub.endpoint.includes("/wp/")
      ) {
        console.log("Removing malformed FCM endpoint:", sub.endpoint);
        return false;
      }
    } catch (error) {
      console.log(
        "Removing subscription with invalid endpoint URL:",
        sub.endpoint
      );
      return false;
    }

    return true;
  });
}

export async function POST(request: Request) {
  try {
    const body: PushSubscription = await request.json();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!isValidPushSubscription(body)) {
      return new NextResponse("Invalid subscription format", { status: 400 });
    }

    const endpoint = body.endpoint;
    const subs = (user.subscriptions as string) || "[]";

    let existingSubscriptions: PushSubscription[] = [];
    try {
      existingSubscriptions = JSON.parse(subs);
      if (!Array.isArray(existingSubscriptions)) {
        existingSubscriptions = [];
      }
    } catch (error) {
      console.error("Error parsing existing subscriptions:", error);
      existingSubscriptions = [];
    }

    // Clean up invalid subscriptions
    const cleanSubscriptions = cleanupSubscriptions(existingSubscriptions);

    // Remove any existing subscription with the same endpoint
    const filteredSubscriptions = cleanSubscriptions.filter(
      (subscription: PushSubscription) => subscription.endpoint !== endpoint
    );

    // Add the new subscription
    const updatedSubscriptions = [...filteredSubscriptions, body];

    // Limit the number of subscriptions per user (optional safety measure)
    const MAX_SUBSCRIPTIONS = 10;
    if (updatedSubscriptions.length > MAX_SUBSCRIPTIONS) {
      // Keep only the most recent subscriptions
      updatedSubscriptions.splice(
        0,
        updatedSubscriptions.length - MAX_SUBSCRIPTIONS
      );
    }

    console.log(
      `User ${user.id} now has ${updatedSubscriptions.length} subscription(s)`
    );

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptions: JSON.stringify(updatedSubscriptions),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionCount: updatedSubscriptions.length,
    });
  } catch (error) {
    console.error("Error registering push subscription:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body: PushSubscription = await request.json();
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!body?.endpoint) {
      return new NextResponse("Missing endpoint", { status: 400 });
    }

    const endpoint = body.endpoint;
    const subs = user.subscriptions || "[]";

    let existingSubscriptions: PushSubscription[] = [];
    try {
      existingSubscriptions = JSON.parse(subs);
      if (!Array.isArray(existingSubscriptions)) {
        existingSubscriptions = [];
      }
    } catch (error) {
      console.error("Error parsing existing subscriptions:", error);
      existingSubscriptions = [];
    }

    // Clean up invalid subscriptions and remove the specified endpoint
    const cleanSubscriptions = cleanupSubscriptions(existingSubscriptions);
    const updatedSubscriptions = cleanSubscriptions.filter(
      (subscription: PushSubscription) => subscription.endpoint !== endpoint
    );

    console.log(
      `Removed subscription for user ${user.id}. Remaining: ${updatedSubscriptions.length}`
    );

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptions: JSON.stringify(updatedSubscriptions),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionCount: updatedSubscriptions.length,
    });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Optional: Add a cleanup endpoint for maintenance
export async function PATCH(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subs = user.subscriptions || "[]";
    let existingSubscriptions: PushSubscription[] = [];

    try {
      existingSubscriptions = JSON.parse(subs);
      if (!Array.isArray(existingSubscriptions)) {
        existingSubscriptions = [];
      }
    } catch (error) {
      existingSubscriptions = [];
    }

    const cleanSubscriptions = cleanupSubscriptions(existingSubscriptions);
    const removedCount =
      existingSubscriptions.length - cleanSubscriptions.length;

    if (removedCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptions: JSON.stringify(cleanSubscriptions),
        },
      });
    }

    return NextResponse.json({
      success: true,
      removedCount,
      remainingCount: cleanSubscriptions.length,
    });
  } catch (error) {
    console.error("Error cleaning up subscriptions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
