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
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        name: true,
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

    const systemPrompt = `You are a helpful assistant for ${user.name}'s business. You can help with:
- Booking appointments
- Answering questions about services
- Providing information about pricing
- General inquiries

Available Services:
${user.domains.flatMap(d => d.services).map(s => `${s.name} ($${s.pricing?.price || 0})`).join('\n') || "No services available"}

Please be professional and helpful in your responses.`;

    // Create booking assistant conversation
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chatbot assistant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 