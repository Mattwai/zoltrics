import { Plans } from "@prisma/client";
import { SUBSCRIPTION_LIMITS } from "@/constants/subscription-limits";

export function checkChatbotFeature(plan: Plans, feature: "customization" | "aiPowered" | "welcomeMessage" | "appearance"): boolean {
  const limits = SUBSCRIPTION_LIMITS[plan];
  if (!limits) return false;
  return limits.chatbot[feature];
}

export function checkAppointmentFeature(plan: Plans, feature: "customTimeSlots" | "durationOptions" | "maxBookingsPerDay" | "advancedScheduling"): boolean | number[] | number {
  const limits = SUBSCRIPTION_LIMITS[plan];
  if (!limits) return false;
  return limits.appointment[feature];
}

export function checkHelpdeskFeature(plan: Plans, feature: "maxFaqs" | "knowledgeBase" | "customQuestions"): boolean | number {
  const limits = SUBSCRIPTION_LIMITS[plan];
  if (!limits) return false;
  return limits.helpdesk[feature];
}

export function checkEmailFeature(plan: Plans, feature: "monthlyCredits" | "templates" | "customBranding"): boolean | number {
  const limits = SUBSCRIPTION_LIMITS[plan];
  if (!limits) return false;
  return limits.email[feature];
}

export function canAddMoreFaqs(plan: Plans, currentFaqCount: number): boolean {
  const maxFaqs = checkHelpdeskFeature(plan, "maxFaqs");
  if (typeof maxFaqs !== "number") return false;
  return maxFaqs === -1 || currentFaqCount < maxFaqs;
}

export function canAddMoreBookings(plan: Plans, currentBookingsCount: number): boolean {
  const maxBookings = checkAppointmentFeature(plan, "maxBookingsPerDay");
  if (typeof maxBookings !== "number") return false;
  return maxBookings === -1 || currentBookingsCount < maxBookings;
}

export function hasEnoughEmailCredits(plan: Plans, currentCredits: number): boolean {
  const monthlyCredits = checkEmailFeature(plan, "monthlyCredits");
  if (typeof monthlyCredits !== "number") return false;
  return monthlyCredits === -1 || currentCredits > 0;
}

export function getAvailableDurationOptions(plan: Plans): number[] {
  const durationOptions = checkAppointmentFeature(plan, "durationOptions");
  if (!Array.isArray(durationOptions)) return [30];
  return durationOptions;
} 