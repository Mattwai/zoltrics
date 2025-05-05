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
    products: {
      name: string;
      price: number;
    }[];
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
        products: domain.products.map(product => ({
          name: product.name,
          price: product.price,
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
              content: `You are a helpful assistant for ${user.name || "the business"}. Your goal is to help users with their questions.

              IMPORTANT: Follow this EXACT response format with proper line breaks, tabs, and spacing. Copy this format exactly:

              Hello! How can I assist you with your booking today?

              Quick Options:
                  - Popular Services: [service name] ($[price])
                  - Next Available Slots:
                      - [date]: [time] ([duration])

              Would you like to book one of these times? Or ask a question? Just say "book" or type your question!

              Available Services:
                  ${user.domains.flatMap(d => d.products).map(p => `${p.name} - $${p.price}`).join('\n                ') || "No products available"}

              FAQs:
                  ${user.helpdesk?.map(hd => `Q: ${hd.question}\n                A: ${hd.answer}`).join('\n\n                ') || "No FAQ information available"}

              Remember:
              1. Use EXACTLY 4 spaces for indentation
              2. Add TWO newlines between major sections
              3. Add ONE newline between list items
              4. Keep the exact format shown above
              5. Don't add any extra formatting or emojis`
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