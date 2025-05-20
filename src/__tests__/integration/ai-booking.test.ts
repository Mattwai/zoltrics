// NOTE: This integration test is skipped due to Next.js route handler polyfill limitations in Jest.
// See: https://github.com/vercel/next.js/issues/49298

// Polyfill TextEncoder/TextDecoder and streams are now handled in jest.setup.js
import { createMocks } from 'node-mocks-http';

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

describe.skip('/api/ai/booking endpoint', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns time slots from suggestOptimalTime', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        action: 'suggestTime',
        data: { date: new Date(), service: { id: '1', name: 'Test', price: 100 } },
      },
    });
    const { POST: handler } = await import('@/app/api/ai/booking/route');
    const response = await handler(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.result)).toBe(true);
    expect(data.result[0].slot).toBe('09:00');
  });

  it('returns error on exception', async () => {
    const { BookingAssistant } = require('@/lib/ai/booking-assistant');
    BookingAssistant.mockImplementationOnce(() => ({
      suggestOptimalTime: jest.fn(async () => { throw new Error('AI error'); }),
    }));
    const { req } = createMocks({
      method: 'POST',
      body: {
        action: 'suggestTime',
        data: { date: new Date(), service: { id: '1', name: 'Test', price: 100 } },
      },
    });
    const { POST: handler } = await import('@/app/api/ai/booking/route');
    const response = await handler(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toMatch(/AI error/);
  });
}); 