import { User, ChatBot, HelpDesk, Domain, Billings, Service, ServicePricing, ServiceStatus, UserBusinessProfile } from "@prisma/client";

export type UserBusinessProfileWithBookingLink = UserBusinessProfile & {
  bookingLink: {
    link: string;
  } | null;
};

export type UserWithRelations = User & {
  chatBot: ChatBot | null;
  helpdesk: HelpDesk[];
  subscription: Billings | null;
  domains: (Domain & {
    services: (Service & {
      pricing: (ServicePricing & {
        currency: string;
      }) | null;
      status: ServiceStatus | null;
    })[];
  })[];
  userBusinessProfile: UserBusinessProfileWithBookingLink | null;
};

export type ServiceWithRelations = Service & {
  pricing: (ServicePricing & {
    currency: string;
  }) | null;
  status: ServiceStatus | null;
};

export type DomainWithServices = Domain & {
  services: ServiceWithRelations[];
};

// Define the Plans enum to match your Prisma schema
export enum Plans {
  STANDARD = "STANDARD",
  PROFESSIONAL = "PROFESSIONAL",
  BUSINESS = "BUSINESS"
} 