import { Plans } from "@prisma/client";

export interface FeatureLimits {
  chatbot: {
    customization: boolean;
    aiPowered: boolean;
    welcomeMessage: boolean;
    appearance: boolean;
  };
  appointment: {
    customTimeSlots: boolean;
    durationOptions: number[];
    maxBookingsPerDay: number;
    advancedScheduling: boolean;
  };
  helpdesk: {
    maxFaqs: number;
    knowledgeBase: boolean;
    customQuestions: boolean;
  };
  email: {
    monthlyCredits: number;
    templates: boolean;
    customBranding: boolean;
  };
}

export const SUBSCRIPTION_LIMITS: Record<Plans, FeatureLimits> = {
  STANDARD: {
    chatbot: {
      customization: false,
      aiPowered: false,
      welcomeMessage: false,
      appearance: false
    },
    appointment: {
      customTimeSlots: false,
      durationOptions: [30, 60],
      maxBookingsPerDay: 5,
      advancedScheduling: false
    },
    helpdesk: {
      maxFaqs: 3,
      knowledgeBase: false,
      customQuestions: false
    },
    email: {
      monthlyCredits: 100,
      templates: false,
      customBranding: false
    }
  },
  PROFESSIONAL: {
    chatbot: {
      customization: true,
      aiPowered: false,
      welcomeMessage: true,
      appearance: true
    },
    appointment: {
      customTimeSlots: true,
      durationOptions: [15, 30, 45, 60, 90],
      maxBookingsPerDay: 20,
      advancedScheduling: true
    },
    helpdesk: {
      maxFaqs: 10,
      knowledgeBase: true,
      customQuestions: true
    },
    email: {
      monthlyCredits: 500,
      templates: true,
      customBranding: false
    }
  },
  BUSINESS: {
    chatbot: {
      customization: true,
      aiPowered: true,
      welcomeMessage: true,
      appearance: true
    },
    appointment: {
      customTimeSlots: true,
      durationOptions: [15, 30, 45, 60, 90, 120],
      maxBookingsPerDay: -1, // unlimited
      advancedScheduling: true
    },
    helpdesk: {
      maxFaqs: -1, // unlimited
      knowledgeBase: true,
      customQuestions: true
    },
    email: {
      monthlyCredits: -1, // unlimited
      templates: true,
      customBranding: true
    }
  }
}; 