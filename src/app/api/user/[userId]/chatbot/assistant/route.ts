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

            IMPORTANT: Follow these response guidelines:

            1. For service-related questions:
            - List all available services with their prices
            - If asked about specific services, provide detailed information about those services
            - Format services as: service name ($price)
            - Example: "We offer the following services: test ($10)"
            - Keep the formatting simple and clean

            2. For availability questions:
            - Show available days and time slots
            - Format as: Available days: [days]
            - Time slots: [slots]
            - Example: "We're available on Wednesday, Thursday, Friday, and Tuesday. Our time slots are [list of slots]"
            - If asked about specific days, check if those days are in the available days list
            - If asked about next week, check the available days and provide appropriate slots

            3. For FAQ/knowledge base or other questions:
            - Search through the provided FAQs and knowledge base
            - Provide relevant answers based on the question
            - If no exact match, provide the most relevant information

            4. For booking-related questions:
            - Guide users through the booking process
            - Show available slots and services
            - Explain the booking requirements

            5. For general questions:
            - Answer naturally and conversationally
            - Use available information about services, availability, and FAQs
            - Keep responses concise and helpful
            - Do not use markdown formatting or emojis

            6. For greeting questions:
            - Greet the user with a friendly message
            - Example: "Hello! How can I assist you today? <br><br>
            If you're interested in our services, booking an appointment, or checking availability, just let me know. <br><br>
            Currently, we offer the following services: <br> 
              - test ($10). <br><br>
            We're available on: <br>
              - Monday <br>
              - Tuesday <br>
              - Wednesday <br>
              - Thursday <br>
              - Friday <br><br><br>
            Let me know how I can help!"

            Available Information:
            Services: ${user.domains.flatMap(d => d.products).map(p => `${p.name} ($${p.price})`).join('\n') || "No products available"}
            Available Days: ${user.bookingCalendarSettings?.availableDays ? user.bookingCalendarSettings.availableDays.join(', ') : "No days available"}
            Time Slots: ${(() => {
              try {
                const slots = typeof user.bookingCalendarSettings?.timeSlots === 'string' 
                  ? JSON.parse(user.bookingCalendarSettings.timeSlots)
                  : user.bookingCalendarSettings?.timeSlots;
                return Array.isArray(slots) ? slots.join(', ') : 'No time slots available';
              } catch (e) {
                return 'No time slots available';
              }
            })()}
            FAQs: ${user.helpdesk?.map(hd => `Q: ${hd.question}\nA: ${hd.answer}`).join('\n\n') || "No FAQ information available"}

            Remember:
            - Be conversational and helpful
            - Use the available information to answer questions
            - If you don't know something, say so and offer to help with what you do know
            - Keep responses focused on the user's question
            - Don't use a template format - respond naturally based on the question
            - For time slots, consider both current and future availability
            - Do not use markdown formatting or emojis in responses
            - Do not use markdown formatting (no ** or __)`
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

    return NextResponse.json({
      response: {
        role: "assistant",
        content: responseData.choices[0].message.content
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