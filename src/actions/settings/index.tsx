"use server";
import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { User, ChatBot, HelpDesk, Domain, Billings } from "@prisma/client";
import { getServerSession } from "next-auth";
import { UserWithRelations, UserBusinessProfileWithBookingLink } from "@/types/prisma";

export const onIntegrateDomain = async (domain: string) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;
  try {
    const subscription = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        _count: {
          select: {
            domains: true,
          },
        },
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });
    const domainExists = await client.user.findFirst({
      where: {
        id: session.user.id,
        domains: {
          some: {
            name: domain,
          },
        },
      },
    });

    if (!domainExists) {
      // WIP
      if (
        (subscription?.subscription?.plan == "STANDARD" &&
          subscription._count.domains < 1) ||
        (subscription?.subscription?.plan == "PROFESSIONAL" &&
          subscription._count.domains < 2) ||
        (subscription?.subscription?.plan == "BUSINESS" &&
          subscription._count.domains < 10)
      ) {
        const newDomain = await client.user.update({
          where: {
            id: session.user.id,
          },
          data: {
            domains: {
              create: {
                name: domain,
              },
            },
            chatBot: {
              upsert: {
                create: {
                  name: "Default ChatBot",
                  welcomeMessage: "Hey there, have a question? Text us here",
                },
                update: {
                  welcomeMessage: "Hey there, have a question? Text us here",
                },
              },
            },
          },
        });

        if (newDomain) {
          return { status: 200, message: "Domain successfully added" };
        }
      }
      return {
        status: 400,
        message:
          "You've reached the maximum number of domains, upgrade your plan",
      };
    }
    return {
      status: 400,
      message: "Domain already exists",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetSubscriptionPlan = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;
  try {
    const plan = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });
    if (plan) {
      return plan.subscription?.plan;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllAccountDomains = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;
  try {
    const userWithDomains = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        domains: {
          include: {
            customers: {
              include: {
                chatRooms: {
                  include: {
                    status: true
                  }
                }
              }
            }
          }
        }
      }
    });
    // Return the domains data if found
    if (userWithDomains) {
      return userWithDomains.domains;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching domains:", error);
    return null;
  }
};

export const onGetCurrentDomainInfo = async (domain: string) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;
  if (!session) return;
  try {
    const userDomain = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
        domains: {
          where: {
            name: {
              contains: domain,
            },
          },
          select: {
            id: true,
            name: true,
            userId: true,
            services: true,
            user: {
              select: {
                chatBot: {
                  select: {
                    id: true,
                    welcomeMessage: true
                  }
                }
              }
            }
          },
        },
        chatBot: {
          select: {
            id: true,
            welcomeMessage: true,
          },
        },
      },
    });
    if (userDomain) {
      return userDomain;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onUpdateDomain = async (id: string, name: string) => {
  try {
    //check if domain with name exists
    const domainExists = await client.domain.findFirst({
      where: {
        name: {
          contains: name,
        },
      },
    });

    if (!domainExists) {
      const domain = await client.domain.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });

      if (domain) {
        return {
          status: 200,
          message: "Domain updated",
        };
      }

      return {
        status: 400,
        message: "Oops something went wrong!",
      };
    }

    return {
      status: 400,
      message: "Domain with this name already exists",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onUpdateWelcomeMessage = async (
  message: string,
  userId: string
) => {
  try {
    const update = await client.user.update({
      where: {
        id: userId,
      },
      data: {
        chatBot: {
          upsert: {
            create: {
              name: "Default ChatBot",
              welcomeMessage: message,
            },
            update: {
              welcomeMessage: message,
            },
          },
        },
      },
    });

    if (update) {
      return { status: 200, message: "Welcome message updated" };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onDeleteUserDomain = async (id: string) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;

  try {
    //first verify that domain belongs to user
    const validUser = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (validUser) {
      //check that domain belongs to this user and delete
      const deletedDomain = await client.domain.delete({
        where: {
          userId: validUser.id,
          id,
        },
        select: {
          name: true,
        },
      });

      if (deletedDomain) {
        return {
          status: 200,
          message: `${deletedDomain.name} was deleted successfully`,
        };
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const onCreateHelpDeskQuestion = async (
  userId: string,
  question: string,
  answer: string
) => {
  try {
    const helpDeskQuestion = await client.user.update({
      where: {
        id: userId,
      },
      data: {
        helpdesk: {
          create: {
            question,
            answer,
          },
        },
      },
      include: {
        helpdesk: {
          select: {
            id: true,
            question: true,
            answer: true,
          },
        },
      },
    });

    if (helpDeskQuestion) {
      return {
        status: 200,
        message: "New help desk question added",
        questions: helpDeskQuestion.helpdesk,
      };
    }

    return {
      status: 400,
      message: "Oops! something went wrong",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllHelpDeskQuestions = async (userId: string) => {
  try {
    const questions = await client.helpDesk.findMany({
      where: {
        userId: userId,
      },
      select: {
        question: true,
        answer: true,
        id: true,
      },
    });

    return {
      status: 200,
      message: "Help desk questions retrieved",
      questions: questions,
    };
  } catch (error) {
    console.log(error);
  }
};

export const onDeleteHelpDeskQuestion = async (questionId: string) => {
  try {
    await client.helpDesk.delete({
      where: {
        id: questionId,
      },
    });

    return {
      status: 200,
      message: "Question deleted successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      status: 400,
      message: "Failed to delete question",
    };
  }
};

export const onUpdateHelpDeskQuestion = async (
  questionId: string,
  question: string,
  answer: string
) => {
  try {
    const updatedQuestion = await client.helpDesk.update({
      where: {
        id: questionId,
      },
      data: {
        question,
        answer,
      },
    });

    if (updatedQuestion) {
      return {
        status: 200,
        message: "Question updated successfully",
        question: updatedQuestion,
      };
    }

    return {
      status: 400,
      message: "Failed to update question",
    };
  } catch (error) {
    console.log(error);
    return {
      status: 400,
      message: "Failed to update question",
    };
  }
};

export const onCreateFilterQuestions = async (userId: string, question: string) => {
  try {
    const filterQuestion = await client.filterQuestions.create({
      data: {
        question,
        userId,
        answer: "",
      },
    });

    if (filterQuestion) {
      return {
        status: 200,
        message: "Filter question added",
        questions: [filterQuestion],
      };
    }
    return {
      status: 400,
      message: "Oops! something went wrong",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllFilterQuestions = async (userId: string) => {
  try {
    const questions = await client.filterQuestions.findMany({
      where: {
        userId: userId,
      },
      select: {
        question: true,
        id: true,
      },
      orderBy: {
        question: "asc",
      },
    });

    return {
      status: 200,
      message: "",
      questions: questions,
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetPaymentConnected = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  try {
    const connected = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        stripeId: true,
      },
    });

    if (connected) {
      return connected.stripeId;
    } else {
      console.warn("No Stripe ID found for user.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching Stripe ID:", error);
    return null;
  }
};

export const onCreateNewDomainService = async (
  userId: string,
  name: string,
  price: number
) => {
  try {
    // Check if user has any domains
    const existingDomain = await client.domain.findFirst({
      where: {
        userId,
      },
    });

    if (existingDomain) {
      // If domain exists, create service under that domain
      const service = await client.service.create({
        data: {
          name,
          userId,
          domainId: existingDomain.id,
          pricing: {
            create: {
              price,
            },
          },
        },
      });

      if (service) {
        return {
          status: 200,
          message: "Service successfully created",
        };
      }
    } else {
      // If no domain exists, create a default domain and add the service
      const domain = await client.domain.create({
        data: {
          name: "Default Domain",
          userId,
        },
      });

      const service = await client.service.create({
        data: {
          name,
          userId,
          domainId: domain.id,
          pricing: {
            create: {
              price,
            },
          },
        },
      });

      if (service) {
        return {
          status: 200,
          message: "Service successfully created",
        };
      }
    }

    return {
      status: 400,
      message: "Failed to create service",
    };
  } catch (error) {
    console.error("Error creating service:", error);
    return {
      status: 500,
      message: "Failed to create service. Please try again.",
    };
  }
};

export const onUpdateServiceStatus = async (serviceId: string, isLive: boolean) => {
  try {
    const service = await client.serviceStatus.upsert({
      where: {
        serviceId
      },
      create: {
        serviceId,
        isLive
      },
      update: {
        isLive
      }
    });

    if (service) {
      return {
        status: 200,
        message: `Service ${isLive ? 'activated' : 'deactivated'} successfully`,
      };
    }

    return {
      status: 400,
      message: "Failed to update service status",
    };
  } catch (error) {
    console.error("Error updating service status:", error);
    return {
      status: 400,
      message: "Failed to update service status. Please try again.",
    };
  }
};

export const onDeleteService = async (serviceId: string) => {
  try {
    const service = await client.service.delete({
      where: {
        id: serviceId,
      },
    });

    if (service) {
      return {
        status: 200,
        message: "Service deleted successfully",
      };
    }

    return {
      status: 400,
      message: "Failed to delete service",
    };
  } catch (error) {
    console.error("Error deleting service:", error);
    return {
      status: 400,
      message: "Failed to delete service. Please try again.",
    };
  }
};

const generateBookingLink = async () => {
  let link;
  let exists = true;

  while (exists) {
    link = Math.random().toString(36).substring(2, 15);
    const userProfile = await client.userBusinessProfile.findUnique({
      where: { id: link },
    });
    exists = !!userProfile;
  }

  return link;
};

export const onGetUser = async (): Promise<UserWithRelations | null> => {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.error("No session or user ID found");
      return null;
    }

    const user = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        domains: {
          include: {
            services: {
              include: {
                pricing: true,
                status: true
              }
            }
          }
        },
        chatBot: true,
        helpdesk: true,
        subscription: true,
        userBusinessProfile: true
      },
    });
    
    if (!user) {
      console.error(`User not found for ID: ${session.user.id}`);
      return null;
    }

    // If no business profile exists, create one
    if (!user.userBusinessProfile) {
      const newBookingLink = await generateBookingLink();
      const updatedProfile = await client.userBusinessProfile.create({
        data: {
          id: newBookingLink,
          userId: user.id,
          businessName: null,
        },
      });

      if (updatedProfile) {
        return {
          ...user,
          userBusinessProfile: {
            ...updatedProfile,
            bookingLink: {
              link: newBookingLink
            }
          } as UserBusinessProfileWithBookingLink,
        } as UserWithRelations;
      }
    }
    
    return user as UserWithRelations;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const onGetWeeklySettings = async (userId: string) => {
  try {
    const settings = await client.bookingCalendarSettings.findUnique({
      where: { userSettingsId: userId },
    });
    
    if (!settings) return null;
    
    return {
      timeSlots: JSON.parse(settings.timeZone as string),
    };
  } catch (error) {
    console.error("Error fetching weekly settings:", error);
    return null;
  }
};

export const onCreateKnowledgeBaseEntry = async (
  userId: string,
  title: string,
  content: string,
  category?: string
) => {
  try {
    const entry = await client.knowledgeBase.create({
      data: {
        title,
        content,
        userId,
      },
    });

    if (entry) {
      return {
        status: 200,
        message: "New knowledge base entry added",
        entries: [entry],
      };
    }

    return {
      status: 400,
      message: "Oops! something went wrong",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllKnowledgeBaseEntries = async (userId: string) => {
  try {
    const entries = await client.knowledgeBase.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        userId: true,
        category: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    return {
      status: 200,
      message: "Knowledge base entries retrieved",
      entries: entries,
    };
  } catch (error) {
    console.log(error);
  }
};
