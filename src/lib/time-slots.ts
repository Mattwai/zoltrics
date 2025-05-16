// Utility functions for handling time slots

import { format, parse, addMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// NZ Timezone constant
export const NZ_TIMEZONE = 'Pacific/Auckland';

/**
 * Generate individual time slots based on start time, end time, and duration
 */
export const generateTimeSlots = (
    startTime: string,
    endTime: string,
    duration: number,
    maxBookings: number = 1
  ) => {
    const slots = [];
    
    try {
      // Determine if times are in 12-hour format
      const is12HourFormat = startTime.toLowerCase().includes('am') || startTime.toLowerCase().includes('pm') ||
                            endTime.toLowerCase().includes('am') || endTime.toLowerCase().includes('pm');
      
      let startHour, startMinute, endHour, endMinute;
      let baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0); // Set to midnight
      
      if (is12HourFormat) {
        // Parse as 12-hour times
        const parsedStartTime = parse(startTime, 'h:mm a', baseDate);
        const parsedEndTime = parse(endTime, 'h:mm a', baseDate);
        
        startHour = parsedStartTime.getHours();
        startMinute = parsedStartTime.getMinutes();
        endHour = parsedEndTime.getHours();
        endMinute = parsedEndTime.getMinutes();
      } else {
        // Parse as 24-hour times
        [startHour, startMinute] = startTime.split(':').map(Number);
        [endHour, endMinute] = endTime.split(':').map(Number);
      }
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      // Loop through the time range and create individual slots
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        // Calculate end time of this slot
        let nextMinute: number = currentMinute + duration;
        let nextHour: number = currentHour;
        
        // Adjust hour if minutes overflow
        while (nextMinute >= 60) {
          nextHour++;
          nextMinute -= 60;
        }
        
        // Only add the slot if it doesn't go beyond the end time
        if (nextHour < endHour || (nextHour === endHour && nextMinute <= endMinute)) {
          // Create date objects for formatting
          const slotStart = new Date(baseDate);
          slotStart.setHours(currentHour, currentMinute);
          
          const slotEnd = new Date(baseDate);
          slotEnd.setHours(nextHour, nextMinute);
          
          // Format with or without AM/PM based on input format
          const formattedStartTime = is12HourFormat 
            ? format(slotStart, 'h:mm a') 
            : `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            
          const formattedEndTime = is12HourFormat 
            ? format(slotEnd, 'h:mm a') 
            : `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
          
          slots.push({
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            duration,
            maxBookings
          });
        }
        
        // Move to next slot
        currentHour = nextHour;
        currentMinute = nextMinute;
      }
      
      return slots;
    } catch (error) {
      console.error('Error generating time slots:', error);
      return [];
    }
  };
  
  /**
   * Format a time slot to always show "start time - end time" format with AM/PM in New Zealand Time
   * @param slot The time slot (could be just start time or already in start-end format)
   * @param defaultDuration Default duration in minutes if only start time is provided
   * @returns Formatted time slot string
   */
  export const formatTimeSlot = (slot: string | Date, defaultDuration: number = 60): string => {
    // Handle Date object input
    if (slot instanceof Date) {
      try {
        // Convert to NZ timezone
        const nzDate = toZonedTime(slot, NZ_TIMEZONE);
        // Calculate end time
        const endTime = toZonedTime(addMinutes(slot, defaultDuration), NZ_TIMEZONE);
        return `${format(nzDate, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
      } catch (error) {
        console.warn('Error formatting Date to NZT:', error);
        return '';
      }
    }

    // For string input
    // Check if the input is a full ISO string (from a Date object)
    if (typeof slot === 'string' && slot.includes('T') && slot.includes('Z')) {
      try {
        const date = new Date(slot);
        // Convert to NZ timezone
        const nzDate = toZonedTime(date, NZ_TIMEZONE);
        // Calculate end time
        const endTime = toZonedTime(addMinutes(date, defaultDuration), NZ_TIMEZONE);
        return `${format(nzDate, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
      } catch (error) {
        console.warn('Error formatting ISO time to NZT:', error);
      }
    }

    // If the slot already has a dash or hyphen, it's already in the "start - end" format
    if (typeof slot === 'string' && (slot.includes('-') || slot.includes('–'))) {
      // Check if the parts already have AM/PM
      const parts = slot.split(/[-–]/);
      if (parts.length === 2) {
        const startPart = parts[0].trim();
        const endPart = parts[1].trim();
        
        // If both parts already have AM/PM indicators, return as is
        if ((startPart.toLowerCase().includes('am') || startPart.toLowerCase().includes('pm')) &&
            (endPart.toLowerCase().includes('am') || endPart.toLowerCase().includes('pm'))) {
          return slot;
        }
        
        // Otherwise, try to reformat with AM/PM
        try {
          // Parse start and end times
          const startTime = parse(startPart, 'HH:mm', new Date());
          const endTime = parse(endPart, 'HH:mm', new Date());
          
          // Return with AM/PM format
          return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
        } catch (error) {
          // If parsing fails, return with current formatting
          console.warn('Error reformatting time range:', error);
          return slot;
        }
      }
    }
    
    // Rest of the function for string processing
    if (typeof slot === 'string') {
      try {
        // Try to parse the start time
        let startTime: Date;
        
        // Check format - time could be in 12-hour or 24-hour format
        if (slot.toLowerCase().includes('am') || slot.toLowerCase().includes('pm')) {
          // 12-hour format
          startTime = parse(slot, 'h:mm a', new Date());
        } else {
          // 24-hour format
          startTime = parse(slot, 'HH:mm', new Date());
        }
        
        // Calculate end time by adding the default duration
        const endTime = addMinutes(startTime, defaultDuration);
        
        // Always format with AM/PM
        return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
      } catch (error) {
        console.warn('Error formatting time slot:', error);
        
        // Last resort: try to make a best effort to add AM/PM if it looks like a time
        if (/^\d{1,2}:\d{2}$/.test(slot)) {
          try {
            const [hours, minutes] = slot.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12; // Convert 0 to 12
            const formattedStart = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
            
            // Calculate end time
            let endHours = hours;
            let endMinutes = minutes + defaultDuration;
            while (endMinutes >= 60) {
              endHours = (endHours + 1) % 24;
              endMinutes -= 60;
            }
            const endPeriod = endHours >= 12 ? 'PM' : 'AM';
            const endHours12 = endHours % 12 || 12;
            const formattedEnd = `${endHours12}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
            
            return `${formattedStart} - ${formattedEnd}`;
          } catch {
            // If all else fails, return the original slot
            return slot;
          }
        }
        
        // If parsing fails, return the original slot
        return slot;
      }
    }
    
    return String(slot); // Fallback for unexpected input types
  };
  
  /**
   * Calculate duration in minutes between two time strings
   */
  export const calculateDuration = (startTime: string, endTime: string): number => {
    try {
      if (!startTime || !endTime) return 30; // Default duration if times are missing
      
      // Check if input times include AM/PM
      const is12HourFormat = startTime.toLowerCase().includes('am') || startTime.toLowerCase().includes('pm') ||
                             endTime.toLowerCase().includes('am') || endTime.toLowerCase().includes('pm');
      
      let startHour, startMinute, endHour, endMinute;
      
      if (is12HourFormat) {
        // Parse as 12-hour times
        const baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);
        
        const parsedStartTime = parse(startTime, 'h:mm a', baseDate);
        const parsedEndTime = parse(endTime, 'h:mm a', baseDate);
        
        startHour = parsedStartTime.getHours();
        startMinute = parsedStartTime.getMinutes();
        endHour = parsedEndTime.getHours();
        endMinute = parsedEndTime.getMinutes();
      } else {
        // Parse as 24-hour times
        [startHour, startMinute] = startTime.split(":").map(Number);
        [endHour, endMinute] = endTime.split(":").map(Number);
      }
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      const duration = endMinutes - startMinutes;
      
      // Handle case where end time is earlier than start time (next day)
      return duration > 0 ? duration : 30;
    } catch (error) {
      console.warn('Error calculating duration:', error);
      return 30; // Default duration on error
    }
  };
  
  /**
   * Generate time options in 15-minute intervals for the entire day
   */
  export const generateTimeOptions = () => {
    const options = [];
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0); // start at midnight

    for (let i = 0; i < 48; i++) { // 30 min intervals for 24 hours
      const time = new Date(startTime.getTime() + i * 30 * 60 * 1000);
      const formattedTime = format(time, 'h:mm a'); // e.g. "1:30 PM"
      options.push(formattedTime);
    }

    return options;
  };
  
  /**
   * Generate a unique ID for time slots (used for both weekly and custom slots)
   */
  export const generateTimeSlotId = (date: string, startTime: string, endTime: string) => {
    return `${date}_${startTime}_${endTime}`;
  };

export const calculateEndTime = (startTime: string, durationMinutes: number) => {
  try {
    // Check if input is in 12-hour format (with AM/PM)
    const is12HourFormat = startTime.toLowerCase().includes('am') || startTime.toLowerCase().includes('pm');
    
    let hours, minutes;
    let baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0); // Set to midnight
    
    if (is12HourFormat) {
      // Parse as 12-hour time
      const parsedTime = parse(startTime, 'h:mm a', baseDate);
      hours = parsedTime.getHours();
      minutes = parsedTime.getMinutes();
    } else {
      // Parse as 24-hour time
      [hours, minutes] = startTime.split(':').map(Number);
    }
    
    // Calculate total minutes and convert to hours/minutes
    let totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    
    // Create new date object for the end time
    const endTime = new Date(baseDate);
    endTime.setHours(endHours, endMinutes);
    
    // Return in the same format as input
    if (is12HourFormat) {
      return format(endTime, 'h:mm a'); // e.g., "1:30 PM"
    } else {
      return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.warn('Error calculating end time:', error);
    // If parsing fails, return a reasonable default
    return startTime;
  }
};