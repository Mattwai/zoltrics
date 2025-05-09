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
    
    // First ensure UserSettings exists
    const userSettings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
      },
      update: {},
    });

    // Now create or update booking calendar settings
    const settings = await prisma.bookingCalendarSettings.upsert({
      where: {
        userSettingsId: userSettings.id,
      },
      update: {
        timeZone: JSON.stringify(timeSlots),
      },
      create: {
        userSettingsId: userSettings.id,
        timeZone: JSON.stringify(timeSlots),
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

    // First get the UserSettings
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!userSettings) {
      return NextResponse.json(null);
    }

    const settings = await prisma.bookingCalendarSettings.findUnique({
      where: {
        userSettingsId: userSettings.id,
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