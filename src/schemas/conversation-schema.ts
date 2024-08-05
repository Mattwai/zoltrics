import { ZodType, z } from "zod";

export type ConversationSearchProps = {
  query: string;
  domain: string;
};

export type ChatBotMessageProps = {
  content?: string;
};

export const ConversationSearchSchema: ZodType<ConversationSearchProps> =
  z.object({
    query: z.string().min(1, { message: "You must entery a search query" }),
    domain: z.string().min(1, { message: "You must select a domain" }),
  });

export const ChatBotMessageSchema: ZodType<ChatBotMessageProps> = z.object({
  content: z
    .string()
    .min(1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
