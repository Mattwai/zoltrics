import { deepseekChatCompletion, DeepSeekMessage } from "./deepseek";

// Types
export interface UserPreferences {
  preferredTime?: string;
  serviceDuration?: number;
}

export interface TimeSlot {
  slot: string;
  available?: boolean;
}

export interface BookingData {
  userId: string;
  date: Date;
  serviceId: string;
}

export interface UserHistory {
  userId: string;
  pastBookings: BookingData[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

export class BookingAssistant {
  // Suggest optimal time slots for a booking
  async suggestOptimalTime(userPreferences: UserPreferences): Promise<TimeSlot[]> {
    const systemPrompt = `You are an expert business assistant. Given user booking preferences, suggest the top 3 optimal time slots for an appointment. Respond as a JSON array of objects with 'slot' (e.g. '09:00') and 'available' (boolean).`;
    const userPrompt = `Preferences: ${JSON.stringify(userPreferences)}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 256 });
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      throw new Error("Invalid DeepSeek response format");
    } catch (e) {
      // fallback: return generic slots
      return [
        { slot: "09:00", available: true },
        { slot: "10:00", available: true },
        { slot: "14:00", available: false },
      ];
    }
  }

  // Predict the probability of a no-show for a booking
  async predictNoShow(bookingData: BookingData): Promise<number> {
    const systemPrompt = `You are an expert business assistant. Given booking data, predict the probability (0-1) that the user will not show up. Respond with a single number.`;
    const userPrompt = `Booking: ${JSON.stringify(bookingData)}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 16 });
      const num = parseFloat(content);
      if (!isNaN(num) && num >= 0 && num <= 1) return num;
      throw new Error("Invalid DeepSeek response format");
    } catch (e) {
      return 0.1;
    }
  }

  // Recommend services based on user history
  async recommendServices(userHistory: UserHistory): Promise<Service[]> {
    const systemPrompt = `You are an expert business assistant. Given a user's booking history, recommend up to 3 services as a JSON array of objects with 'id', 'name', and 'price'.`;
    const userPrompt = `History: ${JSON.stringify(userHistory)}`;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    try {
      const content = await deepseekChatCompletion(messages, { max_tokens: 256 });
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      throw new Error("Invalid DeepSeek response format");
    } catch (e) {
      return [
        { id: "1", name: "Consultation", price: 100 },
        { id: "2", name: "Follow-up", price: 80 },
      ];
    }
  }
} 