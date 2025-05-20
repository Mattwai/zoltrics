import { handleBookingAIAction } from '@/lib/ai/booking-handler';

jest.mock('@/lib/ai/booking-assistant', () => {
  return {
    BookingAssistant: jest.fn().mockImplementation(() => ({
      suggestOptimalTime: jest.fn(async (context) => [
        { slot: '09:00', available: true },
        { slot: '10:00', available: true },
      ]),
      predictNoShow: jest.fn(async () => 0.2),
      recommendServices: jest.fn(async () => [
        { id: '1', name: 'Consultation', price: 100 },
      ]),
    })),
  };
});

describe('handleBookingAIAction', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles suggestTime', async () => {
    const result = await handleBookingAIAction({
      action: 'suggestTime',
      data: { date: new Date(), service: { id: '1', name: 'Test', price: 100 } },
    });
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result) && 'slot' in result[0]) {
      expect(result[0].slot).toBe('09:00');
    }
  });

  it('handles predictNoShow', async () => {
    const result = await handleBookingAIAction({
      action: 'predictNoShow',
      data: { userId: 'u', date: new Date(), serviceId: 's' },
    });
    expect(result).toBe(0.2);
  });

  it('handles recommendServices', async () => {
    const result = await handleBookingAIAction({
      action: 'recommendServices',
      data: { userId: 'u', pastBookings: [] },
    });
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result) && 'name' in result[0]) {
      expect(result[0].name).toBe('Consultation');
    }
  });

  it('throws on invalid action', async () => {
    await expect(handleBookingAIAction({ action: 'invalid', data: {} })).rejects.toThrow('Invalid action');
  });
}); 