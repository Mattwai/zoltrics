import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "UserId is required" },
        { status: 400 }
      );
    }

    // Get all custom time slots for the user
    // You might want to limit this to future dates only in production
    const customSlots = await client.customTimeSlot.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(), // Only return future dates
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({ 
      slots: customSlots
    });
  } catch (error) {
    console.error("Error fetching all custom slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom slots" },
      { status: 500 }
    );
  }
} 