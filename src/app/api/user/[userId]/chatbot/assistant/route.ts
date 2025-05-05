import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type UserWithRelations = {
  id: string;
  name: string | null;
  domains: {
    products: {
      name: string;
      price: number;
    }[];
  }[];
  bookingCalendarSettings?: {
    availableDays: string[];
    timeSlots: any;
  } | null;
  helpdesk?: {
    question: string;
    answer: string;
  }[];
  chatBot?: {
    welcomeMessage: string;
  } | null;
};

function reformatResponse(responseText: string, user: UserWithRelations): string {
  const services = user.domains.flatMap(d => d.products).map(p => `${p.name} - $${p.price}`).join('<br>') || "No products available";
  const availableDays = user.bookingCalendarSettings?.availableDays ? user.bookingCalendarSettings.availableDays.join(', ') : "No days available";
  let timeSlots;
  try {
    const slots = typeof user.bookingCalendarSettings?.timeSlots === 'string' 
      ? JSON.parse(user.bookingCalendarSettings.timeSlots)
      : user.bookingCalendarSettings?.timeSlots;
    timeSlots = Array.isArray(slots) ? slots.join(', ') : 'No time slots available';
  } catch (e) {
    timeSlots = 'No time slots available';
  }
  const faqs = user.helpdesk?.map(hd => `Q: ${hd.question}<br>A: ${hd.answer}`).join('<br><br>') || "No FAQ information available";

  return `<div style="white-space: pre-wrap;">
Hello! How can I assist you with your booking today?

Quick Options:
    - Popular Services: ${user.domains.flatMap(d => d.products)[0]?.name || "None"} ($${user.domains.flatMap(d => d.products)[0]?.price || "0"})
    - Next Available Slots:
        - No available slots

Would you like to book one of these times? Or ask a question? Just say "book" or type your question!

Available Services:
    ${services}

Business Hours:
    Available days: ${availableDays}
    Time slots: ${timeSlots}

FAQs:
    ${faqs}
</div>`;
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    console.log("Received request for userId:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("DeepSeek API key is not set");
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { message, chat } = body;
    console.log("Received message:", message);
    console.log("Received chat history:", chat);

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Format chat history for DeepSeek
    const formattedChat = chat.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    console.log("Formatted chat history:", formattedChat);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        chatBot: true,
        knowledgeBase: {
          select: {
            title: true,
            content: true
          }
        },
        helpdesk: {
          select: {
            question: true,
            answer: true
          }
        },
        domains: {
          select: {
            products: {
              where: { isLive: true },
              select: {
                name: true,
                price: true
              }
            }
          }
        },
        bookingCalendarSettings: {
          select: {
            availableDays: true,
            timeSlots: true
          }
        }
      },
    });
    console.log("Found user:", user?.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create booking assistant conversation
    console.log("Creating DeepSeek chat completion...");
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
            content: `You are a helpful assistant for ${user.name || "the business"}. Your goal is to help users with their questions and book appointments.

            IMPORTANT: Follow these response formats based on the context:

            1. For the initial welcome message, use ONLY:
            ${user.chatBot?.welcomeMessage || "Hello! How can I assist you with your booking today?"}

            2. When you don't know what else to say or need to show options, use this EXACT format:
            Quick Options:
                - Popular Services: [service name] ($[price])
                - Next Available Slots:
                    - [date]: [time] ([duration])

            Would you like to book one of these times? Or ask a question? Just say "book" or type your question!

            Available Services:
                ${user.domains.flatMap(d => d.products).map(p => `${p.name} - $${p.price}`).join('\n                ') || "No products available"}

            Business Hours:
                Available days: ${user.bookingCalendarSettings?.availableDays ? user.bookingCalendarSettings.availableDays.join(', ') : "No days available"}
                Time slots: ${
                  (() => {
                    try {
                      const slots = typeof user.bookingCalendarSettings?.timeSlots === 'string' 
                        ? JSON.parse(user.bookingCalendarSettings.timeSlots)
                        : user.bookingCalendarSettings?.timeSlots;
                      return Array.isArray(slots) ? slots.join(', ') : 'No time slots available';
                    } catch (e) {
                      return 'No time slots available';
                    }
                  })()
                }

            FAQs:
                ${user.helpdesk?.map(hd => `Q: ${hd.question}\n                A: ${hd.answer}`).join('\n\n                ') || "No FAQ information available"}

            3. For all other responses:
            - Answer naturally and conversationally
            - Use the available information about:
                - Customer history
                - Previous appointments
                - Services used
                - Knowledge base entries
                - Available services
                - Available appointment dates
            - Keep responses concise and helpful
            - Maintain a friendly, professional tone

            Remember:
            1. Use EXACTLY 4 spaces for indentation
            2. Add TWO newlines between major sections
            3. Add ONE newline between list items
            4. Keep the exact format shown above for options display
            5. Don't add any extra formatting or emojis`
          },
          ...formattedChat,
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

    const responseData = await response.json();
    console.log("DeepSeek response received:", responseData);

    if (!responseData.choices?.[0]?.message) {
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    // Reformat the response to ensure correct formatting
    const formattedResponse = reformatResponse(responseData.choices[0].message.content, user as UserWithRelations);

    return NextResponse.json({
      response: {
        role: "assistant",
        content: formattedResponse
      }
    });
  } catch (error) {
    console.error("Error in chatbot assistant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 