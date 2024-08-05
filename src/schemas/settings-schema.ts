import { z } from "zod";

export type DomainSettingsProps = {
  domain?: string;
  welcomeMessage?: string;
};

export type HelpDeskQuestionsProps = {
  question: string;
  answer: string;
};

export type AddProductProps = {
  name: string;
  price: string;
};

export type FilterQuestionsProps = {
  question: string;
};

export const AddDomainSchema = z.object({
  domain: z
    .string()
    .min(4, { message: "A domain must have atleast 3 characters" })
    .refine(
      (value) =>
        /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,3}$/.test(value ?? ""),
      "This is not a valid domain"
    ),
});

export const DomainSettingsSchema = z.object({
  domain: z
    .string()
    .min(4, { message: "A domain must have atleast 3 characters" })
    .refine(
      (value) =>
        /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,3}$/.test(value ?? ""),
      "This is not a valid domain"
    )
    .optional()
    .or(z.literal("").transform(() => undefined)),
  welcomeMessage: z
    .string()
    .min(6, "The message must be atleast 6 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const HelpDeskQuestionsSchema = z.object({
  question: z.string().min(1, { message: "Question cannot be left empty" }),
  answer: z.string().min(1, { message: "Question cannot be left empty" }),
});

export const FilterQuestionsSchema = z.object({
  question: z.string().min(1, { message: "Question cannot be left empty" }),
});

export const AddProductSchema = z.object({
  name: z
    .string()
    .min(3, { message: "The name must have atleast 3 characters" }),
  price: z.string(),
});
