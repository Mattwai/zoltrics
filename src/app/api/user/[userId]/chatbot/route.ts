import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ChatBot, HelpDesk, Prisma, User } from "@prisma/client";

type HelpDeskQuestion = {
  id: string;
  userId: string | null;
  question: string;
  answer: string;
};

type UserWithRelations = {
  id: string;
  name: string | null;
  email: string;
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

      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("DeepSeek API key is not set");
        return NextResponse.json(
          { error: "DeepSeek API key is not configured" },
          { status: 500 }
        );
      }

      if (!process.env.DEEPSEEK_API_URL) {
        console.error("DeepSeek API url is not set");
        return NextResponse.json(
          { error: "DeepSeek API url is not configured" },
          { status: 500 }
        );
      }

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
    const relevantEntries = user.knowledgeBase.filter(entry => {
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

    // If no relevant information found, use DeepSeek
    try {
      const response = await fetch(process.env.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant for ${user.name || "the business"}. Your goal is to help users with their questions.
              
              Here is the information about FAQs:
              
              FAQs:
              ${user.helpdesk?.map(hd => `Q: ${hd.question}\nA: ${hd.answer}`).join('\n\n') || "No FAQ information available"}
              
              Knowledge Base:
              ${user.knowledgeBase?.map(kb => `${kb.title}:\n${kb.content}`).join('\n\n') || "No knowledge base information available"}
              
              Be friendly, professional, and direct in your responses.`
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("DeepSeek API error:", errorData);
        return NextResponse.json(
          { error: errorData.error?.message || "Failed to generate response" },
          { status: 500 }
        );
      }

      const data = await response.json();
      console.log("DeepSeek response received:", data);

      if (!data.choices?.[0]?.message) {
        return NextResponse.json(
          { error: "Failed to generate response" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        response: {
          role: "assistant",
          content: data.choices[0].message.content
        }
      });
    } catch (error) {
      console.error("Error in DeepSeek API call:", error);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/user/[userId]/chatbot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 