// Utility functions for handling time slots

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
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Loop through the time range and create individual slots
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      // Calculate end time of this slot
      let nextMinute = currentMinute + duration;
      let nextHour = currentHour;
      
      // Adjust hour if minutes overflow
      while (nextMinute >= 60) {
        nextHour++;
        nextMinute -= 60;
      }
      
      // Only add the slot if it doesn't go beyond the end time
      if (nextHour < endHour || (nextHour === endHour && nextMinute <= endMinute)) {
        slots.push({
          startTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
          endTime: `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`,
          duration,
          maxBookings
        });
      }
      
      // Move to next slot
      currentHour = nextHour;
      currentMinute = nextMinute;
    }
    
    return slots;
  };
  
  /**
   * Generate a formatted time slot for display
   */
  export const formatTimeSlot = (startTime: string, endTime: string) => {
    return `${startTime}`;
  };
  
  /**
   * Calculate duration in minutes between two time strings
   */
  export const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return Math.max(0, endMinutes - startMinutes);
  };
  
  /**
   * Generate time options in 15-minute intervals for the entire day
   */
  export const generateTimeOptions = () => {
    return Array.from({ length: 24 * 4 }, (_, i) => {
      const hour = Math.floor(i / 4);
      const minute = (i % 4) * 15;
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    });
  };
  
  /**
   * Generate a unique ID for time slots (used for both weekly and custom slots)
   */
  export const generateTimeSlotId = (date: string, startTime: string, endTime: string) => {
    return `${date}_${startTime}_${endTime}`;
  };

export const calculateEndTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};