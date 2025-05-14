# Chatbot Tests

This directory contains tests for the chatbot functionality, organized as follows:

## Structure

- **e2e/**: End-to-end tests that interact with the real API
  - `chatbot-interactive.ts`: Interactive test script for manual testing
  
- **integration/**: Integration tests to verify multiple components working together
  - `chatbot.test.ts`: Tests chatbot's information sources
  - `chatbot-integration.test.ts`: Tests chatbot API with mock data
  
- **lib/**: Unit tests for library functions
  - `chatbot-ai-params.test.ts`: Tests AI parameter handling

## Running Tests

### Jest Tests

Run all tests:
```
npm test
```

Run specific test file:
```
npm test -- src/__tests__/integration/chatbot.test.ts
```

### Interactive Tests

For manual testing with real API:
```
# Set a test user ID first
export TEST_USER_ID=your-user-id
npx ts-node src/__tests__/e2e/chatbot-interactive.ts
```

## Test Configuration

The tests verify that the chatbot:

1. Only uses information from authorized sources:
   - Appointment settings
   - Service settings
   - Helpdesk FAQs
   - Filtered questions
   - Knowledge base entries

2. Produces consistent outputs by using appropriate AI parameters:
   - `temperature: 0.1` - Low temperature ensures more deterministic responses
   - `top_p: 0.9` - Focuses sampling on most likely tokens
   - `max_tokens: 500` - Limits response length
   - `frequency_penalty: 0.0` - No penalty for token frequency
   - `presence_penalty: 0.0` - No penalty for token presence

## AI Parameter Considerations

The chatbot uses specific LLM parameters to ensure consistent and predictable outputs:

| Parameter          | Value | Purpose                                              |
|--------------------|-------|------------------------------------------------------|
| temperature        | 0.1   | Lower values make responses more deterministic       |
| top_p              | 0.9   | Restricts sampling to most likely tokens             |
| max_tokens         | 500   | Prevents excessively long responses                  |
| frequency_penalty  | 0.0   | No penalty for using the same token multiple times   |
| presence_penalty   | 0.0   | No penalty for using tokens that already appeared    |

These parameters help ensure that:
- The chatbot gives similar answers to similar questions
- Responses are concise and focused
- The bot sticks to information from authorized sources
- Outputs are predictable and reliable

## Writing New Tests

When writing new tests, follow these guidelines:

1. Place unit tests in the appropriate directory based on what they're testing
2. Use mocks to isolate components and test specific functionality
3. For API integration tests, always include AI parameters to ensure consistent outputs
4. Mock the DeepSeek API to avoid hitting real endpoints during testing
5. Include assertions that verify the chatbot only uses authorized information sources 