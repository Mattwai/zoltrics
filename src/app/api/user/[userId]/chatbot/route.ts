import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { ChatBot, HelpDesk, Prisma, User } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type UserWithRelations = User & {
  chatBot: ChatBot | null;
  helpdesk: HelpDesk[];
};

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
      },
      include: {
        chatBot: true,
        helpdesk: true,
      },
    }) as UserWithRelations | null;

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        {
          status: 404,
        }
      );
    }

    const chatBot = user.chatBot;
    const helpdesk = user.helpdesk;

    return NextResponse.json({
      welcomeMessage: chatBot?.welcomeMessage || "Hi! How can I help you today?",
      background: chatBot?.background || "#ffffff",
      textColor: chatBot?.textColor || "#000000",
      helpdesk: chatBot?.helpdesk || false,
      helpdeskQuestions: helpdesk || [],
    });
  } catch (error) {
    console.error("Error in GET /api/user/[userId]/chatbot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { message } = await request.json();

    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
      },
      include: {
        chatBot: true,
        helpdesk: true,
      },
    }) as UserWithRelations | null;

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        {
          status: 404,
        }
      );
    }

    const chatBot = user.chatBot;
    const helpdesk = user.helpdesk;

    if (chatBot?.helpdesk && helpdesk.length > 0) {
      // Use helpdesk questions for responses
      const matchingQuestion = helpdesk.find(
        (q: HelpDesk) => q.question.toLowerCase() === message.toLowerCase()
      );

      if (matchingQuestion) {
        return NextResponse.json({ response: matchingQuestion.answer });
      }
    }

    // If no matching helpdesk question or helpdesk is disabled, use OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant for a booking system. Help users with their booking-related questions.",
        },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({
      response: completion.choices[0].message?.content,
    });
  } catch (error) {
    console.error("Error in POST /api/user/[userId]/chatbot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
      }
    );
  }
} 