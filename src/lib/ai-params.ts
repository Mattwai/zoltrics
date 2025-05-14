/**
 * AI Parameters Module
 * 
 * This module provides utilities for applying consistent parameters to LLM API calls
 * to ensure deterministic and consistent outputs from the chatbot.
 */

/**
 * Default parameters for consistent LLM output
 */
export const DEFAULT_LLM_PARAMS = {
  temperature: 0.1,       // Low temperature for consistent, deterministic outputs
  top_p: 0.9,             // More focused sampling
  max_tokens: 500,        // Reasonable length limit for responses
  frequency_penalty: 0.0, // No penalty for frequency
  presence_penalty: 0.0   // No penalty for presence
};

/**
 * Message type for LLM requests
 */
export interface LLMMessage {
  role: string;
  content: string;
}

/**
 * Parameters type for LLM requests
 */
export interface LLMParameters {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: any;
}

/**
 * Apply parameters to an LLM API request and return the generated response
 * 
 * @param messages Array of messages to send to the LLM
 * @param params Parameters to apply to the request (overrides defaults)
 * @returns The generated text response
 * @throws Error if the API request fails
 */
export async function applyLLMParameters(
  messages: LLMMessage[],
  params: LLMParameters = {}
): Promise<string> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }
  
  // Merge default parameters with provided parameters
  // Ensure that params values override DEFAULT_LLM_PARAMS
  const requestParams = {
    ...DEFAULT_LLM_PARAMS,
    ...params
  };
  
  // Prepare the request to the DeepSeek API
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: requestParams.temperature,
      top_p: requestParams.top_p,
      max_tokens: requestParams.max_tokens,
      frequency_penalty: requestParams.frequency_penalty,
      presence_penalty: requestParams.presence_penalty
    })
  });
  
  // Handle API response
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Check for expected response format
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from API');
  }
  
  return data.choices[0].message.content;
}

/**
 * Enhanced version of the API route handler that applies consistent parameters
 * for all chatbot requests to the DeepSeek API
 * 
 * @param userId User ID for the chatbot
 * @param message User message
 * @param chatHistory Previous chat history
 * @param customParams Optional custom parameters
 * @returns The generated response
 */
export async function getChatbotResponse(
  userId: string,
  message: string,
  chatHistory: LLMMessage[] = [],
  customParams: LLMParameters = {}
): Promise<{role: string, content: string}> {
  try {
    // Fetch user data from the database
    // Note: In the actual implementation, this would use the prisma client
    const userData = await fetch(`/api/user/${userId}`).then(res => res.json());
    
    // Create system prompt from user data
    const businessName = userData.userBusinessProfile?.businessName || userData.name;
    const systemPrompt = `You are a helpful assistant for ${businessName}'s business. You can help with:
- Booking appointments
- Answering questions about services
- Providing information about pricing
- General inquiries

Available Services:
${userData.services?.map((s: any) => `${s.name} - $${s.price || 0}`).join('\n') || "No services available"}

Please be professional and helpful in your responses.`;

    // Construct messages array with system prompt and chat history
    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message }
    ];
    
    // Apply parameters and get response
    const content = await applyLLMParameters(messages, customParams);
    
    return {
      role: "assistant",
      content
    };
  } catch (error) {
    console.error("Error in getChatbotResponse:", error);
    throw error;
  }
} 