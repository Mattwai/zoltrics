import { NextRequest } from "next/server";
import { ChatbotEnhancer, BusinessContext, Message } from "@/lib/ai/chatbot-enhancer";

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();
    const enhancer = new ChatbotEnhancer();
    let result;

    switch (action) {
      case "generateContextualResponse":
        result = await enhancer.generateContextualResponse(data.query, data.businessContext as BusinessContext);
        break;
      case "predictUserIntent":
        result = await enhancer.predictUserIntent(data.message);
        break;
      case "suggestNextActions":
        result = await enhancer.suggestNextActions(data.conversationHistory as Message[]);
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }
    return new Response(JSON.stringify({ result }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
} 