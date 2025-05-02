import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bookingLink: true,
        domains: {
          take: 1,  // Just get the first domain if available
          select: {
            id: true,
            name: true,
            chatBot: {
              select: {
                id: true,
                welcomeMessage: true,
                background: true,
                textColor: true,
                helpdesk: true,
              }
            },
            helpdesk: {
              select: {
                id: true,
                question: true,
                answer: true,
                domainId: true,
              }
            }
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a default chatbot response
    const defaultChatbot = {
      id: "default",
      welcomeMessage: "Hello! How can I help you with your booking today?",
      background: "#ffffff",
      textColor: "#000000",
      helpdesk: false,
      helpdesk_data: [],
      name: "BookerBuddy",
    };

    // Check if the user has domains with a chatbot
    if (user.domains.length > 0 && user.domains[0].chatBot) {
      const domain = user.domains[0];
      const chatBot = domain.chatBot!; // Non-null assertion since we checked it's not null
      
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          bookingLink: user.bookingLink,
        },
        chatbot: {
          id: chatBot.id,
          welcomeMessage: chatBot.welcomeMessage || defaultChatbot.welcomeMessage,
          background: chatBot.background || defaultChatbot.background,
          textColor: chatBot.textColor || defaultChatbot.textColor,
          helpdesk: chatBot.helpdesk,
          helpdesk_data: domain.helpdesk,
          name: domain.name,
        }
      });
    } else {
      // Return the default chatbot response
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          bookingLink: user.bookingLink,
        },
        chatbot: defaultChatbot
      });
    }
  } catch (error) {
    console.error("Error getting user chatbot:", error);
    return NextResponse.json(
      { error: "Failed to get user chatbot" },
      { status: 500 }
    );
  }
} 