import { BookingAssistant, BookingData, UserHistory, Service } from './booking-assistant';

export async function handleBookingAIAction({ action, data }: { action: string; data: any }) {
  const assistant = new BookingAssistant();
  switch (action) {
    case 'suggestTime':
      return await assistant.suggestOptimalTime(data as { date: Date; service?: Service; user?: { name?: string; email?: string } });
    case 'predictNoShow':
      return await assistant.predictNoShow(data as BookingData);
    case 'recommendServices':
      return await assistant.recommendServices(data as UserHistory);
    default:
      throw new Error('Invalid action');
  }
} 