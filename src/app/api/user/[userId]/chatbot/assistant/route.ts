import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { User, Domain, Service, ServicePricing, ServiceStatus, ChatBot, HelpDesk, KnowledgeBase, BookingCalendarSettings, UserSettings } from "@prisma/client";
import { DEFAULT_LLM_PARAMS, LLMParameters } from "@/lib/ai-params";

type UserWithRelations = User & {
  domains: (Domain & {
    services: (Service & {
      pricing: ServicePricing | null;
      status: ServiceStatus | null;
    })[];
  })[];
  chatBot: ChatBot | null;
  helpdesk: HelpDesk[];
  knowledgeBase: KnowledgeBase[];
  userSettings: (UserSettings & {
    bookingCalendarSettings: BookingCalendarSettings | null;
  }) | null;
  userBusinessProfile: {
    businessName: string;
  } | null;
};

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  try {
    const { message, chat, temperature, top_p, max_tokens, frequency_penalty, presence_penalty } = await req.json();
    
    // Get userId from the URL params
    const urlUserId = params.userId;
    
    // Check if the user is authenticated via session
    const session = await getServerSession(authConfig);
    const isAuthenticated = session && session.user;
    
    // If authenticated, use the session user ID, otherwise use the URL userId
    const userId = isAuthenticated ? session.user.id : urlUserId;
    
    // If we don't have any user ID, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        userBusinessProfile: {
          select: {
            businessName: true
          }
        },
        domains: {
          select: {
            services: {
              where: {
                status: {
                  isLive: true,
                },
              },
              select: {
                name: true,
                pricing: {
                  select: {
                    price: true,
                  },
                },
              },
            },
          },
        },
        chatBot: true,
        helpdesk: true,
        knowledgeBase: true,
        userSettings: {
          select: {
            bookingCalendarSettings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("DeepSeek API key is not set");
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
        { status: 500 }
      );
    }

    // Use business name if available, otherwise fall back to user name
    const businessName = user.userBusinessProfile?.businessName || user.name;

    const systemPrompt = `You are a helpful assistant for ${businessName}'s business. You can help with:
- Booking appointments
- Answering questions about services
- Providing information about pricing
- General inquiries

Available Services:
${user.domains.flatMap(d => d.services).map(s => `${s.name} ($${s.pricing?.price || 0})`).join('\n') || "No services available"}

Please be professional and helpful in your responses.`;

    // Convert message and chat to the format expected by the API
    const messagesToSend = [
      {
        role: "system",
        content: systemPrompt,
      }
    ];
    
    // Add previous chat messages if they exist
    if (Array.isArray(chat) && chat.length > 0) {
      messagesToSend.push(...chat);
    }
    
    // Add the current message
    if (message) {
      messagesToSend.push({
        role: "user",
        content: message
      });
    }

    // Collect AI parameters, using defaults if not provided
    const aiParams: LLMParameters = {
      ...DEFAULT_LLM_PARAMS,
      ...(temperature !== undefined && { temperature }),
      ...(top_p !== undefined && { top_p }),
      ...(max_tokens !== undefined && { max_tokens }),
      ...(frequency_penalty !== undefined && { frequency_penalty }),
      ...(presence_penalty !== undefined && { presence_penalty })
    };

    // Create booking assistant conversation
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messagesToSend,
        temperature: aiParams.temperature,
        top_p: aiParams.top_p,
        max_tokens: aiParams.max_tokens,
        frequency_penalty: aiParams.frequency_penalty,
        presence_penalty: aiParams.presence_penalty
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
      response: data.choices[0].message,
      raw: data 
    });
  } catch (error) {
    console.error("Error in chatbot assistant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 