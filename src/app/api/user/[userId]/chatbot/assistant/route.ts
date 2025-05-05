import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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

    if (!process.env.DEEPSEEK_API_URL) {
      console.error("DeepSeek API url is not set");
      return NextResponse.json(
        { error: "DeepSeek API url is not configured" },
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
        email: true,
        bookingLink: true,
        chatBot: true,
        knowledgeBase: {
          select: {
            title: true,
            content: true,
            category: true
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
              where: {
                isLive: true
              },
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
        },
        customTimeSlots: {
          where: {
            date: {
              gte: new Date()
            }
          },
          select: {
            date: true,
            startTime: true,
            endTime: true,
            duration: true,
            maxSlots: true
          }
        },
        blockedDates: {
          where: {
            date: {
              gte: new Date()
            }
          },
          select: {
            date: true
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
            content: `You are a helpful assistant for ${user.name || "the business"}. Your goal is to help users with their questions and book appointments.

            Here is the information about FAQs:
            
            FAQs:
            ${user.helpdesk?.map(hd => `Q: ${hd.question}\nA: ${hd.answer}`).join('\n\n') || "No FAQ information available"}
            
            Knowledge Base:
            ${user.knowledgeBase?.map(kb => `${kb.title}:\n${kb.content}`).join('\n\n') || "No knowledge base information available"}

            Available Products/Services:
            ${user.domains.flatMap(d => d.products).map(p => `${p.name} - $${p.price}`).join('\n') || "No products available"}

            Regular Business Hours:
            ${user.bookingCalendarSettings?.availableDays ? 
              `Available days: ${user.bookingCalendarSettings.availableDays.join(', ')}\nTime slots: ${JSON.parse(user.bookingCalendarSettings.timeSlots as string).join(', ')}` 
              : "No regular business hours set"}

            Custom Time Slots:
            ${user.customTimeSlots.map(slot => `${new Date(slot.date).toLocaleDateString()}: ${slot.startTime} - ${slot.endTime} (${slot.duration} min, max ${slot.maxSlots} slots)`).join('\n') || "No custom time slots available"}

            Blocked Dates:
            ${user.blockedDates.map(date => new Date(date.date).toLocaleDateString()).join('\n') || "No blocked dates"}

            Be friendly, professional, and direct in your responses. When asked about services or availability:
            1. Provide clear information about available services and their prices
            2. Check availability against regular business hours, custom time slots, and blocked dates
            3. If a requested time is not available, suggest alternative times
            4. Only redirect to the booking form when necessary`
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
    console.error("Error in chatbot assistant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 