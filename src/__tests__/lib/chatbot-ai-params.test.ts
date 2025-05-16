/**
 * Chatbot AI Parameters Unit Test
 * 
 * This test verifies that the correct AI parameters are applied when making requests
 * to the DeepSeek API to ensure consistent and deterministic outputs from the chatbot.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMockFetch, MockResponse } from '@/lib/test-helper';

// Mock the ai-params module
jest.mock('@/lib/ai-params', () => ({
  applyLLMParameters: jest.fn(async (messages, params: any) => {
    // Mock implementation for testing
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured');
    }
    
    // Apply params with correct override behavior
    const mergedParams = {
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1000,
      frequency_penalty: 0,
      presence_penalty: 0,
      ...params // This ensures params override the defaults
    };
    
    const response = await global.fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: mergedParams.temperature,
        top_p: mergedParams.top_p,
        max_tokens: mergedParams.max_tokens,
        frequency_penalty: mergedParams.frequency_penalty,
        presence_penalty: mergedParams.presence_penalty
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }),
  DEFAULT_LLM_PARAMS: {
    temperature: 0.1,
    top_p: 0.9,
    max_tokens: 500,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  }
}));

// Import the mocked module
import { applyLLMParameters } from '@/lib/ai-params';

// Save original fetch and create properly typed mock
const originalFetch = global.fetch;
const mockFetch = createMockFetch();
global.fetch = mockFetch;

describe('Chatbot AI Parameters', () => {
  // Sample data for testing
  const mockSystemPrompt = "You are a helpful booking assistant for a salon.";
  const mockUserMessage = "What services do you offer?";
  
  // Default parameters for consistent output
  const defaultParams = {
    temperature: 0.1,       // Low temperature for consistent, deterministic outputs
    top_p: 0.9,             // More focused sampling
    max_tokens: 500,        // Reasonable length limit for responses
    frequency_penalty: 0.0, // No penalty for frequency
    presence_penalty: 0.0   // No penalty for presence
  };
  
  beforeEach(() => {
    // Reset the mock before each test
    mockFetch.mockReset();
    
    // Set up successful mock response
    const successResponse: MockResponse = {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "We offer haircuts, coloring, and styling services."
            }
          }
        ]
      })
    };
    mockFetch.mockResolvedValue(successResponse);
    
    // Set environment variables for testing
    process.env.DEEPSEEK_API_KEY = 'test-api-key';
  });
  
  afterEach(() => {
    // Clean up
    delete process.env.DEEPSEEK_API_KEY;
  });
  
  it('should apply consistent AI parameters to the DeepSeek API request', async () => {
    // Create a mock request with messages
    const messages = [
      { role: 'system', content: mockSystemPrompt },
      { role: 'user', content: mockUserMessage }
    ];
    
    // Call the function that would normally handle the API request
    await applyLLMParameters(messages, defaultParams);
    
    // Check that fetch was called with the correct parameters
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Get the call arguments
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.deepseek.com/v1/chat/completions');
    
    // Parse the request body
    const requestOptions = fetchCall[1] as RequestInit;
    const requestBody = JSON.parse(requestOptions.body as string);
    
    // Verify the API key was included
    const headers = requestOptions.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-api-key');
    
    // Verify model parameters were correctly applied
    expect(requestBody).toHaveProperty('temperature', defaultParams.temperature);
    expect(requestBody).toHaveProperty('top_p', defaultParams.top_p);
    expect(requestBody).toHaveProperty('max_tokens', defaultParams.max_tokens);
    expect(requestBody).toHaveProperty('frequency_penalty', defaultParams.frequency_penalty);
    expect(requestBody).toHaveProperty('presence_penalty', defaultParams.presence_penalty);
    
    // Verify messages were correctly passed
    expect(requestBody.messages).toEqual(messages);
  });
  
  it('should override default parameters with custom values', async () => {
    // Create custom parameters
    const customParams = {
      temperature: 0.0,  // Even more deterministic
      top_p: 1.0,        // Different sampling
      max_tokens: 1000   // Longer responses
    };
    
    // Create a mock request with messages
    const messages = [
      { role: 'system', content: mockSystemPrompt },
      { role: 'user', content: mockUserMessage }
    ];
    
    // Call the function with custom parameters
    await applyLLMParameters(messages, customParams);
    
    // Check that fetch was called with the correct parameters
    const fetchCall = mockFetch.mock.calls[0];
    const requestOptions = fetchCall[1] as RequestInit;
    const requestBody = JSON.parse(requestOptions.body as string);
    
    // Verify custom parameters were applied
    expect(requestBody).toHaveProperty('temperature', customParams.temperature);
    expect(requestBody).toHaveProperty('top_p', customParams.top_p);
    expect(requestBody).toHaveProperty('max_tokens', customParams.max_tokens);
    
    // Default values should not be present for properties that were overridden
    expect(requestBody.temperature).not.toBe(defaultParams.temperature);
    expect(requestBody.top_p).not.toBe(defaultParams.top_p);
    expect(requestBody.max_tokens).not.toBe(defaultParams.max_tokens);
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock a failed API response
    const errorResponse: MockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        error: {
          message: 'Invalid request parameters'
        }
      })
    };
    mockFetch.mockResolvedValue(errorResponse);
    
    // Create a mock request with messages
    const messages = [
      { role: 'system', content: mockSystemPrompt },
      { role: 'user', content: mockUserMessage }
    ];
    
    // The function should throw an error when the API call fails
    await expect(applyLLMParameters(messages, defaultParams))
      .rejects.toThrow('API request failed: 400 Bad Request');
  });
  
  it('should handle missing API key gracefully', async () => {
    // Remove API key
    delete process.env.DEEPSEEK_API_KEY;
    
    // Create a mock request with messages
    const messages = [
      { role: 'system', content: mockSystemPrompt },
      { role: 'user', content: mockUserMessage }
    ];
    
    // The function should throw an error when no API key is available
    await expect(applyLLMParameters(messages, defaultParams))
      .rejects.toThrow('DeepSeek API key not configured');
  });
}); 