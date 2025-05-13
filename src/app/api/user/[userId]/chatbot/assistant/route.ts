import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { User, Domain, Service, ServicePricing, ServiceStatus, ChatBot, HelpDesk, KnowledgeBase, BookingCalendarSettings, UserSettings } from "@prisma/client";

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
    const { message, chat } = await req.json();
    
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
      }),
    });

    const data = await response.json();
    return NextResponse.json({ 
      response: data.choices[0].message,
      raw: data 
    });
  } catch (error) {
    console.error("Error in chatbot assistant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 