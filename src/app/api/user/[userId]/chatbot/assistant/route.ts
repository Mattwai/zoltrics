import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { message, chat } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bookingLink: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create booking assistant conversation
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
            You are a helpful booking assistant for ${user.name || "the business"}. Your goal is to help users book appointments through the booking form.
            
            The booking form requires:
            - User's name
            - User's email
            - Date selection
            - Time slot selection
            
            You should be friendly, professional, and concise. Guide the user through the booking process and answer any questions they might have about the booking.
            
            If they ask about anything not related to booking, politely redirect them to the booking process or suggest they contact the business directly at ${user.email || "the business email"}.
            
            The booking link for this business is: ${process.env.NEXT_PUBLIC_BASE_URL || "the website"}/booking/${user.bookingLink || "the booking link"}
          `,
        },
        ...chat,
        {
          role: "user",
          content: message,
        },
      ],
    });

    if (chatCompletion.choices.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const response = {
      role: "assistant",
      content: chatCompletion.choices[0].message?.content || "I'm sorry, I couldn't generate a response.",
    };

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chatbot assistant:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
} 