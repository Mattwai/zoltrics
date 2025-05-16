import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";


export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { availableDays, timeSlots, dayTimeSlots, startDate } = await req.json();
    
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
    // Store both the day-indexed timeSlots and the dayTimeSlots object
    const settingsData = {
      timeZone: JSON.stringify({
        timeSlots,
        dayTimeSlots,
        availableDays
      }),
    };

    const settings = await prisma.bookingCalendarSettings.upsert({
      where: {
        userSettingsId: userSettings.id,
      },
      update: settingsData,
      create: {
        userSettingsId: userSettings.id,
        ...settingsData,
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
      // Create UserSettings if it doesn't exist
      const newUserSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
        },
      });

      // Create default BookingCalendarSettings
      const defaultSettings = await prisma.bookingCalendarSettings.create({
        data: {
          userSettingsId: newUserSettings.id,
          timeZone: JSON.stringify({
            dayTimeSlots: {
              "Monday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Tuesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Wednesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Thursday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Friday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Saturday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Sunday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
            },
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            // For backward compatibility
            timeSlots: {
              0: [], // Sunday
              1: [], // Monday
              2: [], // Tuesday
              3: [], // Wednesday
              4: [], // Thursday
              5: [], // Friday
              6: [], // Saturday
            }
          }),
        },
      });

      return NextResponse.json(defaultSettings);
    }

    const settings = await prisma.bookingCalendarSettings.findUnique({
      where: {
        userSettingsId: userSettings.id,
      },
    });

    if (!settings) {
      // Create default BookingCalendarSettings if it doesn't exist
      const defaultSettings = await prisma.bookingCalendarSettings.create({
        data: {
          userSettingsId: userSettings.id,
          timeZone: JSON.stringify({
            dayTimeSlots: {
              "Monday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Tuesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Wednesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Thursday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Friday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Saturday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
              "Sunday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
            },
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            // For backward compatibility
            timeSlots: {
              0: [], // Sunday
              1: [], // Monday
              2: [], // Tuesday
              3: [], // Wednesday
              4: [], // Thursday
              5: [], // Friday
              6: [], // Saturday
            }
          }),
        },
      });

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching booking calendar settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch booking calendar settings" },
      { status: 500 }
    );
  }
} 