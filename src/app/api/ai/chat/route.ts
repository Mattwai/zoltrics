import { NextResponse } from "next/server";
import OpenAI from "openai";

// This code only runs on the server
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, model = "gpt-3.5-turbo" } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required and must be an array" },
        { status: 400 }
      );
    }

    const chatCompletion = await openai.chat.completions.create({
      model,
      messages,
    });

    return NextResponse.json({
      choices: chatCompletion.choices,
    });
  } catch (error) {
    console.error("Error in AI chat API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 