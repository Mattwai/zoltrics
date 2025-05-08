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
    const blockedDate = await prisma.blockedDate.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: requestedDate,
        },
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
            date: {
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
      availableSlots = customSlots.map(slot => {
        return `${formatTimeSlot(slot.startTime, 0).split(' - ')[0]} - ${formatTimeSlot(slot.endTime, 0).split(' - ')[0]}`;
      });
    } else if (user?.userSettings?.bookingCalendarSettings) {
      // Otherwise, use the regular booking calendar settings
      const calendarSettings = user.userSettings.bookingCalendarSettings;
      
      // Check if this day is available in the calendar settings
      const dayNameMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = dayNameMap[jsWeekDay];
      
      if (!calendarSettings.availableDays.includes(dayName)) {
        // This day is not available for booking
        return NextResponse.json({ slots: [] });
      }
      
      // Get timeSlots and cast to our defined interface
      const timeSlots = calendarSettings.timeSlots as unknown as TimeSlotsMap;
      
      // Debug log the timeSlots structure
      console.log("Time slots structure type:", typeof timeSlots);
      console.log("Available keys:", Object.keys(timeSlots));
      console.log("Day of week:", jsWeekDay);
      
      // Handle the case where timeSlots might be a JSON string
      let parsedTimeSlots = timeSlots;
      if (typeof timeSlots === 'string') {
        try {
          parsedTimeSlots = JSON.parse(timeSlots) as TimeSlotsMap;
          console.log("Parsed time slots from JSON string");
        } catch (e) {
          console.error("Failed to parse timeSlots as JSON:", e);
        }
      }
      
      // Get the time slots for the requested day with safer access
      let daySlots: TimeSlot[] = [];
      
      // Check if timeSlots is an object
      if (parsedTimeSlots && typeof parsedTimeSlots === 'object') {
        // Log available keys to help debug
        console.log("Available keys in parsedTimeSlots:", Object.keys(parsedTimeSlots));
        
        // Try to get slots using various key formats and day indexing conventions
        let rawDaySlots = 
          // JavaScript day (0=Sun, 1=Mon)
          parsedTimeSlots[jsWeekDay] || 
          parsedTimeSlots[jsWeekDay.toString()] || 
          // ISO weekday (1=Mon, 7=Sun)
          parsedTimeSlots[isoWeekDay] || 
          parsedTimeSlots[isoWeekDay.toString()] || 
          // Monday as 0 index
          parsedTimeSlots[mondayZeroIndex] || 
          parsedTimeSlots[mondayZeroIndex.toString()] ||
          // Try first by index position if keys are strings (day names)
          parsedTimeSlots[Object.keys(parsedTimeSlots)[jsWeekDay]] ||
          // Try day name directly
          parsedTimeSlots[dayName];
        
        // If rawDaySlots is still undefined, try a more generic approach by checking all numeric-looking keys
        if (!rawDaySlots) {
          console.log("Trying numeric-looking keys as fallback");
          
          // Convert all string keys that could be numbers to actual numbers
          const numericKeys = Object.keys(parsedTimeSlots).filter(key => !isNaN(Number(key)));
          console.log("Found numeric keys:", numericKeys);
          
          // Try to find the day of week in the numeric keys
          for (const key of numericKeys) {
            const numericKey = Number(key);
            // Try all our day calculations to see if any match
            if (numericKey === jsWeekDay || 
                numericKey === isoWeekDay || 
                numericKey === mondayZeroIndex) {
              rawDaySlots = parsedTimeSlots[key];
              console.log(`Found matching day at numeric key: ${key}`);
              break;
            }
          }
        }
        
        if (Array.isArray(rawDaySlots)) {
          daySlots = rawDaySlots;
        } else if (rawDaySlots && typeof rawDaySlots === 'object') {
          // Try to convert to array if possible
          try {
            daySlots = Object.values(rawDaySlots as Record<string, TimeSlot>);
          } catch (err) {
            console.error("Failed to convert day slots to array:", err);
          }
        } else {
          // Try parsing timeSlots directly as a JSON string if it's stored that way
          try {
            const parsedDaySlots = typeof rawDaySlots === 'string' ? 
                                  JSON.parse(rawDaySlots) : rawDaySlots;
            
            if (Array.isArray(parsedDaySlots)) {
              daySlots = parsedDaySlots;
            } else if (parsedDaySlots && typeof parsedDaySlots === 'object') {
              daySlots = Object.values(parsedDaySlots);
            }
          } catch (err) {
            console.log("Failed to parse time slots as JSON:", err);
          }
        }
      }
      
      console.log("Day slots found:", daySlots.length);
      
      // Format the slots as "start time - end time" strings if daySlots is an array
      if (daySlots.length > 0) {
        availableSlots = daySlots.map((slot: TimeSlot | any) => {
          if (slot && typeof slot === 'object' && slot.startTime && slot.endTime) {
            return `${formatTimeSlot(`${slot.startTime}`, 0).split(' - ')[0]} - ${formatTimeSlot(`${slot.endTime}`, 0).split(' - ')[0]}`;
          }
          // Handle legacy format if any
          if (typeof slot === 'string') {
            return formatTimeSlot(slot);
          }
          return '';
        }).filter(Boolean); // Remove any empty strings
      } else {
        console.log("No day slots found or not in expected format");
      }
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
        date: {
          // We need to use a date range to match the date part only
          gte: new Date(`${dateParam}T00:00:00.000Z`),
          lt: new Date(`${dateParam}T23:59:59.999Z`),
        },
      },
      select: {
        slot: true,
      },
    });

    const bookedSlots = bookedAppointments.map((appointment: { slot: string }) => appointment.slot);
    
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