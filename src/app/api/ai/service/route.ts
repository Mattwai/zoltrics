import { NextRequest } from "next/server";
import { ServiceOptimizer, ServiceData, BookingPattern, ServiceDetails } from "@/lib/ai/service-optimizer";

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();
    const optimizer = new ServiceOptimizer();
    let result;

    switch (action) {
      case "suggestPricing":
        result = await optimizer.suggestPricing(data as ServiceData);
        break;
      case "optimizeAvailability":
        result = await optimizer.optimizeAvailability(data as BookingPattern[]);
        break;
      case "generateServiceDescription":
        result = await optimizer.generateServiceDescription(data as ServiceDetails);
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }
    return new Response(JSON.stringify({ result }), { status: 200 });
  } catch (error) {
    // Log error with context
    try {
      const { action, data } = await req.json();
      console.error("[AI Service API Error]", { action, data, error: (error as Error).message });
    } catch {}
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
} 