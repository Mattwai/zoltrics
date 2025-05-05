import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { ChatBot, HelpDesk, Prisma, User } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type HelpDeskQuestion = {
  id: string;
  userId: string | null;
  question: string;
  answer: string;
  knowledgeBase?: string;
};

type UserWithRelations = {
  id: string;
  chatBot: ChatBot | null;
  helpdesk: HelpDeskQuestion[];
  knowledgeBase: {
    id: string;
    title: string;
    content: string;
    category?: string;
  }[];
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
        knowledgeBase: true,
      },
    }) as UserWithRelations | null;

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Search through knowledge base entries
    const relevantEntries = (user as UserWithRelations).knowledgeBase.filter(entry => {
      const searchTerms = message.toLowerCase().split(' ');
      const entryText = `${entry.title} ${entry.content} ${entry.category || ''}`.toLowerCase();
      return searchTerms.some((term: string) => entryText.includes(term));
    });

    if (relevantEntries.length > 0) {
      // Combine relevant information
      const response = relevantEntries
        .map(entry => `${entry.title}:\n${entry.content}`)
        .join('\n\n');
      
      return NextResponse.json({ response });
    }

    // If no relevant information found
    return NextResponse.json({
      response: "I apologize, but I don't have enough information in my knowledge base to answer that question. Please contact a human agent for assistance."
    });
  } catch (error) {
    console.error("Error in POST /api/user/[userId]/chatbot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 