import { deepseekChatCompletion, DeepSeekMessage } from "@/lib/ai/deepseek";

global.fetch = jest.fn();

describe("deepseekChatCompletion", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns content from DeepSeek on success", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          { message: { role: "assistant", content: "Hello from DeepSeek!" } },
        ],
      }),
    });
    process.env.DEEPSEEK_API_KEY = "test-key";
    const messages: DeepSeekMessage[] = [
      { role: "system", content: "Test system" },
      { role: "user", content: "Test user" },
    ];
    const result = await deepseekChatCompletion(messages);
    expect(result).toBe("Hello from DeepSeek!");
  });

  it("throws on DeepSeek API error", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "DeepSeek error" } }),
    });
    process.env.DEEPSEEK_API_KEY = "test-key";
    const messages: DeepSeekMessage[] = [
      { role: "system", content: "Test system" },
      { role: "user", content: "Test user" },
    ];
    await expect(deepseekChatCompletion(messages)).rejects.toThrow("DeepSeek error");
  });

  it("throws if no API key is set", async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: "Test system" },
      { role: "user", content: "Test user" },
    ];
    await expect(deepseekChatCompletion(messages)).rejects.toThrow("DeepSeek API key is not configured");
  });
}); 