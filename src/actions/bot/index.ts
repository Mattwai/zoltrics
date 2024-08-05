import { client } from "@/lib/prisma";
import { extractEmailsFromString, extractURLfromString } from "@/lib/utils";
import { clerkClient } from "@clerk/nextjs";
import OpenAi from "openai";
import { onRealTimeChat } from "../conversation";
import { onMailer } from "../mailer";

const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
});

interface FilterQuestion {
  question: string;
}

export const onStoreConversations = async (
  id: string,
  message: string,
  role: "assistant" | "user"
) => {
  await client.chatRoom.update({
    where: {
      id,
    },
    data: {
      message: {
        create: {
          message,
          role,
        },
      },
    },
  });
};

export const onGetCurrentChatBot = async (id: string) => {
  try {
    const chatbot = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        helpdesk: true,
        name: true,
        chatBot: {
          select: {
            id: true,
            welcomeMessage: true,
            textColor: true,
            background: true,
            helpdesk: true,
          },
        },
      },
    });

    return chatbot; // Return the fetched chatbot or null if not found
  } catch (error) {
    console.log(error);
    return null; // Return null in case of an error
  }
};

export const onAiChatBotAssistant = async (
  id: string,
  chat: { role: "assistant" | "user"; content: string }[],
  author: "user",
  message: string
) => {
  try {
    const chatBotDomain = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        filterQuestions: {
          where: {
            answered: null,
          },
          select: {
            question: true,
          },
        },
      },
    });

    if (!chatBotDomain) {
      throw new Error("Chatbot domain not found"); // Handle case where chatbot domain is null or undefined
    }

    const extractedEmail = extractEmailsFromString(message);
    let customerEmail: string | undefined = undefined;

    if (extractedEmail) {
      customerEmail = extractedEmail[0];
    }

    if (customerEmail) {
      const checkCustomer = await client.domain.findUnique({
        where: {
          id,
        },
        select: {
          User: {
            select: {
              clerkId: true,
            },
          },
          name: true,
          customer: {
            where: {
              email: {
                startsWith: customerEmail,
              },
            },
            select: {
              id: true,
              email: true,
              questions: true,
              chatRoom: {
                select: {
                  id: true,
                  live: true,
                  mailed: true,
                },
              },
            },
          },
        },
      });

      if (checkCustomer && checkCustomer.customer.length === 0) {
        const newCustomer = await client.domain.update({
          where: {
            id,
          },
          data: {
            customer: {
              create: {
                email: customerEmail,
                questions: {
                  create: chatBotDomain.filterQuestions,
                },
                chatRoom: {
                  create: {},
                },
              },
            },
          },
        });

        if (newCustomer) {
          console.log("New customer created");

          const response = {
            role: "assistant",
            content: `Welcome aboard ${
              customerEmail.split("@")[0]
            }! I'm glad to connect with you. Is there anything you need help with?`,
          };

          return { response };
        }
      }

      if (checkCustomer && checkCustomer.customer[0].chatRoom[0].live) {
        await onStoreConversations(
          checkCustomer?.customer[0].chatRoom[0].id!,
          message,
          author
        );

        onRealTimeChat(
          checkCustomer.customer[0].chatRoom[0].id,
          message,
          "user",
          author
        );

        if (!checkCustomer.customer[0].chatRoom[0].mailed) {
          const user = await clerkClient.users.getUser(
            checkCustomer.User?.clerkId!
          );
          onMailer(user.emailAddresses[0].emailAddress);

          // Update mail status to prevent spamming
          const updatedChatRoom = await client.chatRoom.update({
            where: { id: checkCustomer.customer[0].chatRoom[0].id },
            data: { mailed: true },
          });

          if (updatedChatRoom) {
            return {
              live: true,
              chatRoom: checkCustomer.customer[0].chatRoom[0].id,
            };
          }
        }
      }

      await onStoreConversations(
        checkCustomer?.customer[0].chatRoom[0].id!,
        message,
        author
      );

      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: `
              You will get an array of questions that you must ask the customer.

              Progress the conversation using those questions.

              Whenever you ask a question from the array i need you to add a keyword at the end of the question (complete) this keyword is extremely important.

              Do not forget it.

              only add this keyword when your asking a question from the array of questions. No other question satisfies this condition

              Always maintain character and stay respectfull.

              The array of questions : [${chatBotDomain.filterQuestions
                .map((questions: FilterQuestion) => questions.question)
                .join(", ")}]

              if the customer says something out of context or inapporpriate. Simply say this is beyond you and you will get a real user to continue the conversation. And add a keyword (realtime) at the end.

              if the customer agrees to book an appointment send them this link ${
                process.env.BASE_URL
              }/portal/${id}/appointment/${checkCustomer?.customer[0].id}

              if the customer wants to buy a product redirect them to the payment page ${
                process.env.BASE_URL
              }/portal/${id}/payment/${checkCustomer?.customer[0].id}
            `,
          },
          ...chat,
          {
            role: "user",
            content: message,
          },
        ],
        model: "gpt-3.5-turbo",
      });

      if (chatCompletion.choices[0].message.content?.includes("(realtime)")) {
        const realtime = await client.chatRoom.update({
          where: {
            id: checkCustomer?.customer[0].chatRoom[0].id,
          },
          data: {
            live: true,
          },
        });

        if (realtime) {
          const response = {
            role: "assistant",
            content: chatCompletion.choices[0].message.content.replace(
              "(realtime)",
              ""
            ),
          };

          await onStoreConversations(
            checkCustomer?.customer[0].chatRoom[0].id!,
            response.content,
            "assistant"
          );

          return { response };
        }
      }

      if (chat[chat.length - 1].content.includes("(complete)")) {
        const firstUnansweredQuestion =
          await client.customerResponses.findFirst({
            where: {
              customerId: checkCustomer?.customer[0].id,
              answered: null,
            },
            select: {
              id: true,
            },
            orderBy: {
              question: "asc",
            },
          });
        if (firstUnansweredQuestion) {
          await client.customerResponses.update({
            where: {
              id: firstUnansweredQuestion.id,
            },
            data: {
              answered: message,
            },
          });
        }
      }

      if (chatCompletion) {
        const generatedLink = extractURLfromString(
          chatCompletion.choices[0].message.content as string
        );

        if (generatedLink) {
          const link = generatedLink[0];
          const response = {
            role: "assistant",
            content: `Great! you can follow the link to proceed`,
            link: link.slice(0, -1),
          };

          await onStoreConversations(
            checkCustomer?.customer[0].chatRoom[0].id!,
            `${response.content} ${response.link}`,
            "assistant"
          );

          return { response };
        }

        const response = {
          role: "assistant",
          content: chatCompletion.choices[0].message.content,
        };

        await onStoreConversations(
          checkCustomer?.customer[0].chatRoom[0].id!,
          `${response.content}`,
          "assistant"
        );

        return { response };
      }
    }
    console.log("No customer");
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `
            You are a highly knowledgeable and experienced sales representative for a ${chatBotDomain.name} that offers a valuable product or service. Your goal is to have a natural, human-like conversation with the customer in order to understand their needs, provide relevant information, and ultimately guide them towards making a purchase or redirect them to a link if they havent provided all relevant information.
            Right now you are talking to a customer for the first time. Start by giving them a warm welcome on behalf of ${chatBotDomain.name} and make them feel welcomed.

            Your next task is lead the conversation naturally to get the customers email address. Be respectful and never break character

          `,
        },
        ...chat,
        {
          role: "user",
          content: message,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    if (chatCompletion) {
      const response = {
        role: "assistant",
        content: chatCompletion.choices[0].message.content,
      };

      return { response };
    }
  } catch (error) {
    console.log(error);
  }
};
