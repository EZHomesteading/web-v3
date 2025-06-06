import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import prisma from "@/lib/prismadb";
import webPush, { PushSubscription } from "web-push";
import { getUserById } from "@/utils/user";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const body = await request.json();
    const { message, messageOrder, image, conversationId, otherUserId, fee } =
      body;

    if (!user?.id || !user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const recipients = await prisma.user.findUnique({
      where: {
        id: otherUserId,
      },
    });

    const newMessage = await prisma.message.create({
      include: {
        sender: true,
      },
      data: {
        body: message,
        messageOrder: messageOrder,
        fee: fee,
        image: image,
        conversation: {
          connect: { id: conversationId },
        },
        sender: {
          connect: { id: user.id },
        },
      },
    });

    const updatedConversation = await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: new Date(),
        messages: {
          connect: {
            id: newMessage.id,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    await pusherServer.trigger(conversationId, "messages:new", newMessage);

    const lastMessage =
      updatedConversation.messages[updatedConversation.messages.length - 1];

    updatedConversation.participantIds.map(async (Id) => {
      const user = await getUserById(Id);
      pusherServer.trigger(user?.email!, "conversation:update", {
        id: conversationId,
        messages: [lastMessage],
      });
    });

    // Enhanced push notification handling with cleanup
    if (recipients?.subscriptions) {
      try {
        const recipientSubs = recipients.subscriptions;
        const formatrecipients = JSON.parse(recipientSubs);
        const validSubscriptions: any[] = [];
        const invalidSubscriptions = [];

        // Send notifications and track results
        const notificationPromises = formatrecipients.map(
          async (subscription: PushSubscription) => {
            try {
              await webPush.sendNotification(
                subscription,
                JSON.stringify({
                  title: user.name,
                  body: message,
                  id: conversationId,
                }),
                {
                  vapidDetails: {
                    subject: "mailto:ezhomesteading@gmail.com",
                    publicKey: process.env
                      .NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY as string,
                    privateKey: process.env.WEB_PUSH_PRIVATE_KEY as string,
                  },
                }
              );
              validSubscriptions.push(subscription);
            } catch (error: any) {
              console.error("Push notification failed:", error);

              // Check for expired/invalid subscription errors
              if (
                error.statusCode === 404 ||
                error.statusCode === 410 ||
                error.statusCode === 413
              ) {
                console.log(
                  "Removing invalid subscription:",
                  subscription.endpoint
                );
                invalidSubscriptions.push(subscription);
              } else {
                // For other errors, keep the subscription but log the error
                console.error("Non-expiry push error:", error);
                validSubscriptions.push(subscription);
              }
            }
          }
        );

        await Promise.allSettled(notificationPromises);

        // Clean up invalid subscriptions from database
        if (invalidSubscriptions.length > 0) {
          console.log(
            `Cleaning up ${invalidSubscriptions.length} invalid subscriptions`
          );

          await prisma.user.update({
            where: { id: otherUserId },
            data: {
              subscriptions: JSON.stringify(validSubscriptions),
            },
          });
        }
      } catch (error) {
        console.error("Push notification error:", error);
      }
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error(error, "ERROR_MESSAGES");
    return new NextResponse("Error", { status: 500 });
  }
}
