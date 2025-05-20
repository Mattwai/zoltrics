import { client } from "@/lib/prisma";

export interface BusinessHours {
  [key: string]: {
    startTime: string;
    endTime: string;
    duration: number;
    maxBookings: number;
  };
}

export async function getBusinessHours(userId: string): Promise<BusinessHours | null> {
  try {
    const userSettings = await client.userSettings.findFirst({
      where: { userId },
      include: {
        bookingCalendarSettings: true
      }
    });

    if (!userSettings?.bookingCalendarSettings?.timeZone) {
      // Return default business hours if no settings found
      return {
        Monday: { startTime: '09:00', endTime: '17:00', duration: 60, maxBookings: 1 },
        Tuesday: { startTime: '09:00', endTime: '17:00', duration: 60, maxBookings: 1 },
        Wednesday: { startTime: '09:00', endTime: '17:00', duration: 60, maxBookings: 1 },
        Thursday: { startTime: '09:00', endTime: '17:00', duration: 60, maxBookings: 1 },
        Friday: { startTime: '09:00', endTime: '17:00', duration: 60, maxBookings: 1 },
        Saturday: { startTime: '09:00', endTime: '13:00', duration: 60, maxBookings: 1 },
        Sunday: { startTime: '09:00', endTime: '13:00', duration: 60, maxBookings: 1 }
      };
    }

    try {
      const settings = JSON.parse(userSettings.bookingCalendarSettings.timeZone);
      const formattedHours: BusinessHours = {};
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      // Handle new format with dayTimeSlots
      if (settings.dayTimeSlots) {
        daysOfWeek.forEach(day => {
          const daySettings = settings.dayTimeSlots[day];
          if (daySettings && settings.availableDays.includes(day)) {
            formattedHours[day] = {
              startTime: convertTo24Hour(daySettings.startTime),
              endTime: convertTo24Hour(daySettings.endTime),
              duration: daySettings.duration || 60,
              maxBookings: daySettings.maxBookings || 1
            };
          }
        });
      }
      // Handle legacy format
      else {
        daysOfWeek.forEach(day => {
          const dayIndex = daysOfWeek.indexOf(day);
          const daySlots = settings[dayIndex];
          if (daySlots && daySlots.length > 0) {
            formattedHours[day] = {
              startTime: daySlots[0].startTime,
              endTime: daySlots[daySlots.length - 1].endTime,
              duration: daySlots[0].duration || 60,
              maxBookings: daySlots[0].maxBookings || 1
            };
          }
        });
      }

      return Object.keys(formattedHours).length > 0 ? formattedHours : null;
    } catch (error) {
      console.error('Error parsing calendar settings:', error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching business hours:', error);
    return null;
  }
}

function convertTo24Hour(time: string): string {
  if (!time.includes('AM') && !time.includes('PM')) {
    return time;
  }

  const [timePart, period] = time.split(/\s+(AM|PM)/i);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  let hour = hours;
  if (period.toUpperCase() === 'PM' && hours < 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
} 