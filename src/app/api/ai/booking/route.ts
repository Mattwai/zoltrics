import { NextRequest } from "next/server";
import { BookingAssistant, UserPreferences, BookingData, UserHistory, Service } from "@/lib/ai/booking-assistant";

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();
    const assistant = new BookingAssistant();
    let result;

    switch (action) {
      case "suggestTime":
        result = await assistant.suggestOptimalTime(data as { date: Date; service?: Service; user?: { name?: string; email?: string } });
        break;
      case "predictNoShow":
        result = await assistant.predictNoShow(data as BookingData);
        break;
      case "recommendServices":
        result = await assistant.recommendServices(data as UserHistory);
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }
    return new Response(JSON.stringify({ result }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
} 