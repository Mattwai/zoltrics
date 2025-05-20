import { deepseekChatCompletion, DeepSeekMessage } from "./deepseek";

// Types
export interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

export interface PricingRecommendation {
  recommendedPrice: number;
  reason: string;
}

export interface BookingPattern {
  date: string;
  count: number;
}

export interface AvailabilitySchedule {
  availableSlots: string[];
}

export interface ServiceDetails {
  name: string;
  description?: string;
  features?: string[];
}

export class ServiceOptimizer {
  // Suggest optimal pricing for a service
  async suggestPricing(serviceData: ServiceData): Promise<PricingRecommendation> {
    const systemPrompt = `You are an expert business assistant. Given service data, suggest an optimal price and a short reason. Respond as a JSON object with 'recommendedPrice' (number) and 'reason' (string).`;
    const userPrompt = `Service: ${JSON.stringify(serviceData)}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 128 });
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed.recommendedPrice) return parsed;
      throw new Error("Invalid DeepSeek response format");
    } catch (e) {
      return {
        recommendedPrice: serviceData.price,
        reason: "Based on current market and business data."
      };
    }
  }

  // Optimize availability schedule based on booking patterns
  async optimizeAvailability(bookingPatterns: BookingPattern[]): Promise<AvailabilitySchedule> {
    const systemPrompt = `You are an expert business assistant. Given booking patterns, suggest the best available time slots as a JSON array of strings (e.g. ['09:00', '10:00']).`;
    const userPrompt = `Patterns: ${JSON.stringify(bookingPatterns)}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 128 });
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return { availableSlots: parsed };
      throw new Error("Invalid DeepSeek response format");
    } catch (e) {
      return {
        availableSlots: ["09:00", "10:00", "11:00"]
      };
    }
  }

  // Generate a service description
  async generateServiceDescription(serviceDetails: ServiceDetails): Promise<string> {
    const systemPrompt = `You are an expert business assistant. Given service details, generate a concise, attractive service description for customers.`;
    const userPrompt = `Details: ${JSON.stringify(serviceDetails)}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 128 });
      return content.trim();
    } catch (e) {
      return `Service: ${serviceDetails.name}. ${serviceDetails.description || ""}`;
    }
  }
} 