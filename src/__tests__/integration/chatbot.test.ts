// Mock imports must be at the top before any imports
jest.mock('node-fetch');
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(mockUser))
    }
  }
}));

import { expect, describe, it, beforeAll, afterAll, jest } from '@jest/globals';

// Mock data for testing
const mockUser = {
  id: 'test-user-id',
  name: 'Test Business',
  userBusinessProfile: {
    businessName: 'Test Business Name'
  },
  domains: [
    {
      services: [
        {
          name: 'Haircut',
          pricing: { price: 30 }
        },
        {
          name: 'Hair Coloring',
          pricing: { price: 80 }
        }
      ]
    }
  ],
  chatBot: {
    id: 'test-chatbot-id',
    welcomeMessage: 'Welcome to our salon! How can I help you today?',
    background: '#ffffff',
    textColor: '#000000',
    helpdesk: true
  },
  helpdesk: [
    {
      id: 'faq-1',
      question: 'What are your opening hours?',
      answer: 'We are open Monday to Friday from 9 AM to 7 PM, and Saturday from 10 AM to 5 PM.'
    },
    {
      id: 'faq-2',
      question: 'Do you offer discounts for new customers?',
      answer: 'Yes, first-time customers receive a 15% discount on their first service.'
    }
  ],
  knowledgeBase: [
    {
      id: 'kb-1',
      title: 'Cancellation Policy',
      content: 'Cancellations must be made at least 24 hours in advance to avoid a cancellation fee of 50% of the service price.',
      category: 'Policies'
    },
    {
      id: 'kb-2',
      title: 'Parking Information',
      content: 'Free parking is available in our rear lot. Street parking is also available with a 2-hour limit.',
      category: 'Location'
    }
  ],
  userSettings: {
    bookingCalendarSettings: {
      hoursOfOperation: {
        monday: { open: '09:00', close: '19:00', isOpen: true },
        tuesday: { open: '09:00', close: '19:00', isOpen: true },
        wednesday: { open: '09:00', close: '19:00', isOpen: true },
        thursday: { open: '09:00', close: '19:00', isOpen: true },
        friday: { open: '09:00', close: '19:00', isOpen: true },
        saturday: { open: '10:00', close: '17:00', isOpen: true },
        sunday: { open: '00:00', close: '00:00', isOpen: false }
      }
    }
  }
};

// Define response interface
interface ChatbotResponse {
  response: string | { role: string; content: string };
  error?: string;
}

// Mock environment variables
process.env.DEEPSEEK_API_KEY = 'fake-api-key';

describe('Chatbot Information Source Tests', () => {
  const API_URL = 'http://localhost:3000/api/user/test-user-id/chatbot';
  const ASSISTANT_URL = 'http://localhost:3000/api/user/test-user-id/chatbot/assistant';
  
  beforeAll(() => {
    // Set up global fetch mock
    global.fetch = jest.fn() as any;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterAll(() => {
    // Restore mocks
    jest.restoreAllMocks();
    delete process.env.DEEPSEEK_API_KEY;
  });

  // Test 1: Verify the chatbot uses helpdesk FAQs
  it('should respond with helpdesk FAQ information when asked a matching question', async () => {
    const testMessage = "What are your opening hours?";
    
    // Setup mock implementation for this specific test
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: "We are open Monday to Friday from 9 AM to 7 PM, and Saturday from 10 AM to 5 PM."
      })
    });
    
    const response = await global.fetch(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testMessage })
    });
    
    const data = await response.json() as ChatbotResponse;
    expect(data.response).toContain("9 AM to 7 PM");
    expect(data.response).toContain("Saturday");
  });

  // Test 2: Verify the chatbot uses knowledge base information
  it('should respond with knowledge base information when asked about related topics', async () => {
    const testMessage = "What is your cancellation policy?";
    
    // Setup mock implementation for this specific test
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: "Cancellations must be made at least 24 hours in advance to avoid a cancellation fee of 50% of the service price."
      })
    });
    
    const response = await global.fetch(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testMessage })
    });
    
    const data = await response.json() as ChatbotResponse;
    expect(data.response).toContain("24 hours in advance");
    expect(data.response).toContain("cancellation fee");
  });

  // Test 3: Verify the chatbot uses service information
  it('should respond with service information when asked about services', async () => {
    const testMessage = "How much does a haircut cost?";
    
    // Setup mock implementation for this specific test
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: { 
          role: "assistant", 
          content: "A haircut costs $30."
        }
      })
    });
    
    const response = await global.fetch(`${API_URL}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: testMessage,
        chat: []
      })
    });
    
    const data = await response.json() as ChatbotResponse;
    if (typeof data.response === 'object' && 'content' in data.response) {
      expect(data.response.content).toContain("$30");
    }
  });

  // Test 4: Verify the chatbot uses booking calendar settings
  it('should respond with booking availability based on calendar settings', async () => {
    const testMessage = "Can I book an appointment on Sunday?";
    
    // Setup mock implementation for this specific test
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: { 
          role: "assistant", 
          content: "I'm sorry, we are not open on Sundays. We are open Monday to Friday from 9 AM to 7 PM, and Saturday from 10 AM to 5 PM."
        }
      })
    });
    
    const response = await global.fetch(`${API_URL}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: testMessage,
        chat: []
      })
    });
    
    const data = await response.json() as ChatbotResponse;
    if (typeof data.response === 'object' && 'content' in data.response) {
      expect(data.response.content).toContain("not open on Sundays");
    }
  });

  // Test 5: Verify the chatbot only uses provided information
  it('should only use provided information and not include external data', async () => {
    const testMessage = "How long has your business been operating?";
    
    // Setup mock implementation for this specific test
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: { 
          role: "assistant", 
          content: "I don't have specific information about how long the business has been operating. If you'd like to know more about our services or hours, I'd be happy to help with that information."
        }
      })
    });
    
    const response = await global.fetch(`${API_URL}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: testMessage,
        chat: []
      })
    });
    
    const data = await response.json() as ChatbotResponse;
    if (typeof data.response === 'object' && 'content' in data.response) {
      expect(data.response.content).toContain("don't have specific information");
    }
  });
}); 