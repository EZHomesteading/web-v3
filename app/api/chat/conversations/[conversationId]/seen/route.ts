// route to handle seen messages with pusher
import { NextResponse, NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import prisma from "@/lib/prismadb";

interface IParams {
  conversationId?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: IParams }
) {
  try {
    const user = await currentUser();
    const resolvedParams = await params;
    const conversationId = resolvedParams.conversationId;
    const body = await request.json();
    const { seen } = body;

    if (!user?.id || !user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find existing conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: true,
      },
    });

    if (!conversation) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    // Find last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (!lastMessage) {
      return NextResponse.json(conversation);
    }

    // Update seen of last message
    const updatedMessage = await prisma.message.update({
      where: {
        id: lastMessage?.id,
      },
      include: {
        sender: { select: { image: true, email: true } },
      },
      data: {
        seen: seen,
      },
    });

    // Update all connections with new seen
    await pusherServer.trigger(user.email, "conversation:update", {
      id: conversationId,
      messages: [updatedMessage],
    });

    // If user has already seen the message, no need to go further
    if (lastMessage.seen === true) {
      return NextResponse.json(conversation);
    }

    // Update last message seen - FIXED EVENT NAME TO MATCH CLIENT
    await pusherServer.trigger(
      conversationId!,
      "message:update", // Client is listening for "message:update"
      updatedMessage
    );

    return new NextResponse("Success");
  } catch (error) {
    console.error(error, "ERROR_MESSAGES_SEEN");
    return new NextResponse("Error", { status: 500 });
  }
}
