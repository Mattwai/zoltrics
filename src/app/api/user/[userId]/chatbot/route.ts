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
  domains: {
    name: string;
    services: {
      name: string;
      pricing: {
        price: number;
      } | null;
    }[];
  }[];
  userBusinessProfile: {
    businessName: string | null;
  } | null;
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
        domains: true,
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
      domains: user.domains.map(domain => ({
        name: domain.name,
        services: domain.services.map(service => ({
          name: service.name,
          price: service.pricing?.price || 0,
        })),
      })),
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

    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
      },
      include: {
        chatBot: true,
        knowledgeBase: true,
        userBusinessProfile: {
          select: {
            businessName: true
          }
        },
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
      // Use business name if available, otherwise fall back to user name
      const businessName = user.userBusinessProfile?.businessName || user.name;

      const systemPrompt = `You are a helpful assistant for ${businessName}'s business. You can help with:
- Booking appointments
- Answering questions about services
- Providing information about pricing
- General inquiries

Available services:
${user.domains.flatMap(d => d.services).map(s => `${s.name} - $${s.pricing?.price || 0}`).join('\n') || "No services available"}

Please be professional and helpful in your responses.`;

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
              content: systemPrompt,
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