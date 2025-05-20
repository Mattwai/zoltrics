// Polyfill ReadableStream/WritableStream for Node.js test environment
try {
  const streams = require('web-streams-polyfill/ponyfill');
  if (!global.ReadableStream) global.ReadableStream = streams.ReadableStream;
  if (!global.WritableStream) global.WritableStream = streams.WritableStream;
} catch {}

// Polyfill TextEncoder/TextDecoder for Node.js test environment
try {
  const { TextEncoder, TextDecoder } = require('util');
  if (!global.TextEncoder) global.TextEncoder = TextEncoder;
  if (!global.TextDecoder) global.TextDecoder = TextDecoder;
} catch {}

// Polyfill fetch, Request, Response, Headers for Node.js test environment
try {
  const { fetch, Request, Response, Headers } = require('undici');
  if (!global.fetch) global.fetch = fetch;
  if (!global.Request) global.Request = Request;
  if (!global.Response) global.Response = Response;
  if (!global.Headers) global.Headers = Headers;
} catch {}

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Configure test environment for act()
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: The current testing environment is not configured to support act(...)')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock the next-auth/react module
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: {
      user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated',
  })),
}));

// Mock Pusher client
jest.mock('pusher-js', () => {
  return jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// Mock Pusher server
jest.mock('pusher', () => {
  return jest.fn().mockImplementation(() => ({
    trigger: jest.fn(),
  }));
});

// Mock fetch
global.fetch = jest.fn();

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Optional: add any global setup needed for tests
// This file is run before each test file

// Load environment variables for tests
require('dotenv').config({ path: '.env.test' });

// Add any other test setup here 