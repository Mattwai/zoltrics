// Types
export interface UserPreferences {
  preferredTime?: string;
  serviceDuration?: number;
}

export interface TimeSlot {
  slot: string;
  available?: boolean;
}

export interface BookingData {
  userId: string;
  date: Date;
  serviceId: string;
}

export interface UserHistory {
  userId: string;
  pastBookings: BookingData[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

export class BookingAssistant {
  // Suggest optimal time slots for a booking
  async suggestOptimalTime(userPreferences: UserPreferences): Promise<TimeSlot[]> {
    // TODO: Integrate with AI/ML model for real suggestions
    return [
      { slot: "09:00", available: true },
      { slot: "10:00", available: true },
      { slot: "14:00", available: false },
    ];
  }

  // Predict the probability of a no-show for a booking
  async predictNoShow(bookingData: BookingData): Promise<number> {
    // TODO: Integrate with AI/ML model for prediction
    return 0.1; // 10% chance as a stub
  }

  // Recommend services based on user history
  async recommendServices(userHistory: UserHistory): Promise<Service[]> {
    // TODO: Integrate with AI/ML model for recommendations
    return [
      { id: "1", name: "Consultation", price: 100 },
      { id: "2", name: "Follow-up", price: 80 },
    ];
  }
} 