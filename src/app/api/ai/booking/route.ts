import { NextRequest } from "next/server";
import { handleBookingAIAction } from "@/lib/ai/booking-handler";

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();
    const result = await handleBookingAIAction({ action, data });
    return new Response(JSON.stringify({ result }), { status: 200 });
  } catch (error) {
    // Log error with context
    try {
      const { action, data } = await req.json();
      console.error("[AI Booking API Error]", { action, data, error: (error as Error).message });
    } catch {}
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
} 