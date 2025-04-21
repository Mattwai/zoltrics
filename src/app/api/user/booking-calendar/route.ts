import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { availableDays, timeSlots, startDate } = await req.json();
    
    // Update or create booking calendar settings
    const settings = await prisma.bookingCalendarSettings.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        availableDays,
        timeSlots: JSON.stringify(timeSlots),
        startDate: new Date(startDate),
      },
      create: {
        userId: session.user.id,
        availableDays,
        timeSlots: JSON.stringify(timeSlots),
        startDate: new Date(startDate),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error saving booking calendar settings:", error);
    return NextResponse.json(
      { message: "Failed to save booking calendar settings" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const settings = await prisma.bookingCalendarSettings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching booking calendar settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch booking calendar settings" },
      { status: 500 }
    );
  }
} 