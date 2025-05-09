import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { format } from "date-fns";
import { formatTimeSlot } from "@/lib/time-slots";

// Define a type for the time slots structure
interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  maxBookings: number;
}

// Define a type for the timeSlots structure that allows number indexing
interface TimeSlotsMap {
  [key: string]: TimeSlot[] | undefined;
  [key: number]: TimeSlot[] | undefined;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date from query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Create a date object for the requested date
    const requestedDate = new Date(dateParam);

    // Check if the date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        userId: session.user.id,
        date: requestedDate,
      },
    });

    // If the date is blocked, return empty slots
    if (blockedDate) {
      return NextResponse.json({ slots: [] });
    }

    // Get the user's appointment settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userSettings: {
          include: {
            bookingCalendarSettings: true,
          }
        },
        customTimeSlots: {
          where: {
            startTime: {
              gte: new Date(`${dateParam}T00:00:00.000Z`),
              lt: new Date(`${dateParam}T23:59:59.999Z`),
            }
          }
        }
      },
    });

    // Format the date to get the day of week (0 = Sunday, 1 = Monday, etc.)
    const jsWeekDay = requestedDate.getDay(); // JS: 0 is Sunday, 1 is Monday, etc.
    
    // Alternative day indexes to try (some systems use Monday as 1)
    // ISO day of week: 1 is Monday, 7 is Sunday
    const isoWeekDay = jsWeekDay === 0 ? 7 : jsWeekDay;
    // Monday as 1, Sunday as 7 index
    const mondayOneIndex = isoWeekDay;
    // Monday as 0, Sunday as 6 index (shift by 1)
    const mondayZeroIndex = (isoWeekDay - 1 + 7) % 7;
    
    console.log("JS day of week (0-Sun, 1-Mon):", jsWeekDay);
    console.log("ISO day of week (1-Mon, 7-Sun):", isoWeekDay);
    console.log("Monday-zero day of week (0-Mon, 6-Sun):", mondayZeroIndex);
    
    // Check if there's a custom time slot for this date
    const customSlots = user?.customTimeSlots || [];
    
    let availableSlots: string[] = [];
    
    if (customSlots.length > 0) {
      // Use custom slots if available
      availableSlots = customSlots.map((slot) => {
        return `${format(slot.startTime, 'HH:mm')} - ${format(slot.endTime, 'HH:mm')}`;
      });
    } else if (user?.userSettings?.bookingCalendarSettings) {
      // Otherwise, use the regular booking calendar settings
      const calendarSettings = user.userSettings.bookingCalendarSettings;
      
      // Check if this day is available in the calendar settings
      const dayNameMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = dayNameMap[jsWeekDay];
      
      // Default to available if no settings are specified
      const isDayAvailable = true;
      
      if (!isDayAvailable) {
        // This day is not available for booking
        return NextResponse.json({ slots: [] });
      }
      
      // Default time slots if none are specified
      availableSlots = [
        "09:00 - 10:00",
        "10:00 - 11:00",
        "11:00 - 12:00",
        "13:00 - 14:00",
        "14:00 - 15:00",
        "15:00 - 16:00",
      ];
    } else {
      // If no settings found, return default slots
      availableSlots = [
        "9:00 AM - 10:00 AM",
        "10:00 AM - 11:00 AM",
        "11:00 AM - 12:00 PM",
        "1:00 PM - 2:00 PM",
        "2:00 PM - 3:00 PM",
        "3:00 PM - 4:00 PM",
      ];
    }
    
    // Get already booked slots for this date to exclude them
    const bookedAppointments = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: new Date(`${dateParam}T00:00:00.000Z`),
          lt: new Date(`${dateParam}T23:59:59.999Z`),
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const bookedSlots = bookedAppointments.map((appointment) => 
      `${format(appointment.startTime, 'HH:mm')}-${format(appointment.endTime, 'HH:mm')}`
    );
    
    // Filter out already booked slots
    const availableTimeSlots = availableSlots.filter((slot: string) => !bookedSlots.includes(slot));

    return NextResponse.json({ slots: availableTimeSlots });
  } catch (error) {
    console.error("[AVAILABLE_SLOTS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}