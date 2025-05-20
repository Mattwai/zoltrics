import { deepseekChatCompletion, DeepSeekMessage } from "./deepseek";

// Types
export interface BusinessContext {
  businessName: string;
  services: string[];
}

export interface UserIntent {
  intent: string;
  confidence: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Action {
  label: string;
  action: string;
}

export class ChatbotEnhancer {
  // Generate a contextual response for the chatbot
  async generateContextualResponse(query: string, businessContext: BusinessContext): Promise<string> {
    const systemPrompt = `You are an AI business chatbot. Use the business context to answer the user's query. Be concise, helpful, and professional.`;
    const userPrompt = `Business: ${JSON.stringify(businessContext)}\nQuery: ${query}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 256 });
      return content.trim();
    } catch (e) {
      return `You asked: ${query}. [Context: ${businessContext.businessName}]`;
    }
  }

  // Predict user intent from a message
  async predictUserIntent(message: string): Promise<UserIntent> {
    const systemPrompt = `You are an AI assistant. Given a user message, predict the intent (e.g. 'book_appointment', 'ask_services', 'general_inquiry') and a confidence (0-1). Respond as a JSON object with 'intent' and 'confidence'.`;
    const userPrompt = `Message: ${message}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 64 });
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed.intent && typeof parsed.confidence === "number") return parsed;
      throw new Error("Invalid DeepSeek response format");
    } catch (e) {
      return { intent: "general_inquiry", confidence: 0.95 };
    }
  }

  // Suggest next actions based on conversation history
  async suggestNextActions(conversationHistory: Message[]): Promise<Action[]> {
    const systemPrompt = `You are an AI assistant. Given the conversation history, suggest up to 3 next actions as a JSON array of objects with 'label' and 'action'.`;
    const userPrompt = `History: ${JSON.stringify(conversationHistory)}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 128 });
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      throw new Error("Invalid DeepSeek response format");
    } catch (e) {
      return [
        { label: "Book Appointment", action: "book_appointment" },
        { label: "Ask About Services", action: "ask_services" }
      ];
    }
  }
} 