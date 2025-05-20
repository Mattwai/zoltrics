export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekParams {
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  [key: string]: any;
}

export interface DeepSeekResponse {
  choices: { message: { role: string; content: string } }[];
}

export async function deepseekChatCompletion(
  messages: DeepSeekMessage[],
  params: DeepSeekParams = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DeepSeek API key is not configured");

  const body = {
    model: params.model || "deepseek-chat",
    messages,
    ...params,
  };

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = `DeepSeek API error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = (await response.json()) as DeepSeekResponse;
  if (!data.choices?.[0]?.message?.content) {
    throw new Error("No response from DeepSeek");
  }
  return data.choices[0].message.content;
} 