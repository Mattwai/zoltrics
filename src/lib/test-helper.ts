/**
 * Test Helpers
 * 
 * Utility functions and types to assist with testing.
 */

/**
 * Creates a properly typed mock for the global fetch function
 * that can be used in tests without TypeScript errors.
 */
export function createMockFetch() {
  const mockFn = jest.fn();
  // Use a cast to ensure TypeScript accepts our mock implementation
  return mockFn as jest.Mock & typeof global.fetch;
}

/**
 * Type helper for response objects in fetch mocks
 */
export type MockResponse = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: () => Promise<any>;
  [key: string]: any;
};
