"use server";
import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { User } from "@prisma/client";
import { getServerSession } from "next-auth";

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
        (subscription?.subscription?.plan == "FREE" &&
          subscription._count.domains < 1) ||
        (subscription?.subscription?.plan == "STANDARD" &&
          subscription._count.domains < 2) ||
        (subscription?.subscription?.plan == "PROFESSIONAL" &&
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
                chatBot: {
                  create: {
                    welcomeMessage: "Hey there, have  a question? Text us here",
                  },
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
      select: {
        id: true,
        domains: {
          select: {
            name: true,
            id: true,
            customer: {
              select: {
                chatRoom: {
                  select: {
                    id: true,
                    live: true,
                  },
                },
              },
            },
          },
        },
      },
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
            products: true,
            chatBot: {
              select: {
                id: true,
                welcomeMessage: true,
              },
            },
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
  domainId: string
) => {
  try {
    const update = await client.domain.update({
      where: {
        id: domainId,
      },
      data: {
        chatBot: {
          update: {
            data: {
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
  id: string,
  question: string,
  answer: string
) => {
  try {
    const helpDeskQuestion = await client.domain.update({
      where: {
        id,
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

export const onGetAllHelpDeskQuestions = async (id: string) => {
  try {
    const questions = await client.helpDesk.findMany({
      where: {
        domainId: id,
      },
      select: {
        question: true,
        answer: true,
        id: true,
      },
    });

    return {
      status: 200,
      message: "New help desk question added",
      questions: questions,
    };
  } catch (error) {
    console.log(error);
  }
};

export const onCreateFilterQuestions = async (id: string, question: string) => {
  try {
    const filterQuestion = await client.domain.update({
      where: {
        id,
      },
      data: {
        filterQuestions: {
          create: {
            question,
          },
        },
      },
      include: {
        filterQuestions: {
          select: {
            id: true,
            question: true,
          },
        },
      },
    });

    if (filterQuestion) {
      return {
        status: 200,
        message: "Filter question added",
        questions: filterQuestion.filterQuestions,
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

export const onGetAllFilterQuestions = async (id: string) => {
  try {
    const questions = await client.filterQuestions.findMany({
      where: {
        domainId: id,
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

export const onCreateNewDomainProduct = async (
  id: string,
  name: string,
  price: string
) => {
  try {
    const product = await client.domain.update({
      where: {
        id,
      },
      data: {
        products: {
          create: {
            name,
            price: parseInt(price),
          },
        },
      },
    });

    if (product) {
      return {
        status: 200,
        message: "Product successfully created",
      };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onUpdateProfileIcon = async (profileIcon: string) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user)
    return { status: 401, message: "Unauthorized" };
  try {
    const update = await client.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        profileIcon: profileIcon,
      },
    });

    if (update) {
      return { status: 200, message: "Profile icon updated" };
    }
  } catch (error) {
    console.error("Error updating profile icon:", error);
    return { status: 500, message: "Internal server error" };
  }
};
export const onGetProfileIcon = async (): Promise<string | undefined> => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;
  try {
    const user = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        profileIcon: true,
      },
    });
    if (!user) throw new Error("User not found");
    return user.profileIcon;
  } catch (error) {
    console.error("Error fetching profile icon:", error);
    return;
  }
};

export const onGetUser = async (): Promise<User | null> => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;
  try {
    const user = await client.user.findUnique({
      where: {
        id: session.user.id,
      },
    });
    if (!user) throw new Error("User not found");
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
