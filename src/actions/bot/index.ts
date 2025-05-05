import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { extractEmailsFromString, extractURLfromString } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { onRealTimeChat } from "../conversation";
import { onMailer } from "../mailer";
import prisma from "@/lib/prisma";
import { ChatBotMessageProps } from "@/schemas/conversation-schema";

// Helper function to call our secure API endpoint
async function callChatAPI(messages: any[]) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: "gpt-3.5-turbo",
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling chat API:", error);
    throw error;
  }
}

interface FilterQuestion {
  question: string;
}

export const onStoreConversations = async (
  id: string,
  message: string,
  role: "assistant" | "user"
) => {
  await client.chatRoom.update({
    where: {
      id,
    },
    data: {
      message: {
        create: {
          message,
          role,
        },
      },
    },
  });
};

type HelpDeskQuestion = {
  id: string;
  question: string;
  answer: string;
};

type KnowledgeBaseEntry = {
  id: string;
  title: string;
  content: string;
  category?: string;
};

type ChatBotWithRelations = {
  id: string;
  welcomeMessage: string | null;
  background: string | null;
  textColor: string | null;
  helpdesk: boolean;
  User: {
    name: string | null;
    helpdesk: HelpDeskQuestion[];
    knowledgeBase: KnowledgeBaseEntry[];
  } | null;
};

export const onAiChatBotAssistant = async (
  botId: string,
  chat: { role: string; content: string }[],
  role: string,
  message: string
) => {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DeepSeek API key is not configured");
    }

    const bot = await prisma.chatBot.findUnique({
      where: {
        id: botId,
      },
      include: {
        User: {
          select: {
            name: true,
            helpdesk: true,
            knowledgeBase: true,
          },
        },
      },
    }) as ChatBotWithRelations | null;

    if (!bot || !bot.User) {
      throw new Error("Bot not found");
    }

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
            content: `You are a helpful assistant for ${bot.User.name || "the business"}. Your goal is to help users with their questions.
            
            Here is the information about FAQs:
            
            FAQs:
            ${bot.User.helpdesk?.map(hd => `Q: ${hd.question}\nA: ${hd.answer}`).join('\n\n') || "No FAQ information available"}
            
            Knowledge Base:
            ${bot.User.knowledgeBase?.map(kb => `${kb.title}:\n${kb.content}`).join('\n\n') || "No knowledge base information available"}
            
            Be friendly, professional, and direct in your responses.`
          },
          ...chat,
          {
            role,
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("DeepSeek API error:", errorData);
      throw new Error(errorData.error?.message || "Failed to generate response");
    }

    const data = await response.json();
    console.log("DeepSeek response received:", data);

    if (!data.choices?.[0]?.message) {
      throw new Error("Failed to generate response");
    }

    return {
      response: {
        role: "assistant",
        content: data.choices[0].message.content
      }
    };
  } catch (error) {
    console.error("Error in AI chatbot assistant:", error);
    throw error;
  }
};

export const onGetCurrentChatBot = async (botId: string) => {
  try {
    const bot = await prisma.chatBot.findUnique({
      where: {
        id: botId,
      },
      include: {
        User: {
          select: {
            name: true,
            helpdesk: true,
          },
        },
      },
    });

    if (!bot) {
      throw new Error("Bot not found");
    }

    return bot;
  } catch (error) {
    console.error("Error getting current chatbot:", error);
    throw error;
  }
};
