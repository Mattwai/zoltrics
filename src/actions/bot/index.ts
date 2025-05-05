import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { extractEmailsFromString, extractURLfromString } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { onRealTimeChat } from "../conversation";
import { onMailer } from "../mailer";

// We no longer need the OpenAI client directly here
// Removed the dangerous browser flag

// Helper function to call our secure API endpoint
async function callChatAPI(messages: any[]) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: "gpt-3.5-turbo",
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling chat API:", error);
    throw error;
  }
}

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
    const domain = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        User: {
          select: {
            chatBot: true,
            helpdesk: {
              select: {
                id: true,
                question: true,
                answer: true,
              },
            },
          },
        },
      },
    });

    if (!domain || !domain.User) {
      return null;
    }

    return {
      name: domain.name,
      chatBot: domain.User.chatBot,
      helpdesk: domain.User.helpdesk.map(h => ({
        ...h,
        domainId: null,
      })),
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const onAiChatBotAssistant = async (
  id: string,
  chat: { role: "assistant" | "user"; content: string }[],
  author: "user",
  message: string
) => {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const chatBotDomain = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        User: {
          select: {
            filterQuestions: {
              where: {
                answered: null,
              },
              select: {
                question: true,
              },
            },
            knowledgeBase: {
              select: {
                title: true,
                content: true,
                category: true,
              },
            },
            bookingLink: true,
          },
        },
      },
    });

    if (!chatBotDomain || !chatBotDomain.User) {
      throw new Error("Chatbot domain not found");
    }

    // Format knowledge base entries for the prompt
    const knowledgeBaseContext = chatBotDomain.User.knowledgeBase
      .map(entry => `Title: ${entry.title}\nContent: ${entry.content}${entry.category ? `\nCategory: ${entry.category}` : ''}`)
      .join('\n\n');

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
              id: true,
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
                  create: chatBotDomain.User.filterQuestions,
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
          // Fetch user email from session or user object obtained from client.user.findUnique
          const userEmail = user.email; // Adjust as per your schema

          onMailer(userEmail);

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

      const chatCompletionResponse = await callChatAPI([
        {
          role: "assistant",
          content: `
            You are a highly knowledgeable and experienced sales representative for ${chatBotDomain.name}. Your goal is to have a natural, human-like conversation with the customer to understand their needs and provide relevant information.

            Here is the knowledge base information you should use to answer questions:
            ${knowledgeBaseContext}

            Important guidelines:
            1. When asked about services, use the knowledge base information to provide detailed, accurate responses
            2. Keep responses natural and conversational
            3. If you don't have information about something in the knowledge base, be honest and say you don't have that information
            4. Always maintain a professional and helpful tone
            5. If the customer asks about services, provide specific details from the knowledge base
            6. If they haven't provided their email, naturally guide the conversation to collect it

            You will get an array of questions that you must ask the customer. Progress the conversation using those questions.
            The array of questions: [${chatBotDomain.User.filterQuestions
              .map((questions: FilterQuestion) => questions.question)
              .join(", ")}]

            Important rules for questions:
            1. Whenever you ask a question from the array, add the keyword (complete) at the end of the question
            2. Only add the (complete) keyword when asking a question from the array
            3. Maintain a natural conversation flow - don't just list questions
            4. If the customer asks about services, answer using the knowledge base first, then continue with the questions
            5. If the customer says something inappropriate, respond with "I apologize, but I need to transfer you to a real person to continue this conversation" and add (realtime) at the end
            6. If the customer wants to book an appointment or asks about booking, ALWAYS direct them to the booking link: ${process.env.NEXT_PUBLIC_BASE_URL}/booking/${chatBotDomain.User.bookingLink}
            7. Never try to book appointments directly - always use the booking link
            8. If the customer wants to buy a product, direct them to the payment page: ${process.env.NEXT_PUBLIC_BASE_URL}/portal/${id}/payment/${checkCustomer?.customer[0].id}

            Right now you are talking to a customer. Start by giving them a warm welcome on behalf of ${chatBotDomain.name} and make them feel welcomed.
          `,
        },
        ...chat,
        {
          role: "user",
          content: message,
        },
      ]);

      const chatCompletion = { choices: chatCompletionResponse.choices };

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
    const chatCompletionResponse = await callChatAPI([
      {
        role: "assistant",
        content: `
          You are a highly knowledgeable and experienced sales representative for ${chatBotDomain.name}. Your goal is to have a natural, human-like conversation with the customer to understand their needs and provide relevant information.

          Here is the knowledge base information you should use to answer questions:
          ${knowledgeBaseContext}

          Important guidelines:
          1. When asked about services, use the knowledge base information to provide detailed, accurate responses
          2. Keep responses natural and conversational
          3. If you don't have information about something in the knowledge base, be honest and say you don't have that information
          4. Always maintain a professional and helpful tone
          5. If the customer asks about services, provide specific details from the knowledge base
          6. Your primary goal is to collect the customer's email address naturally
          7. If the customer says something inappropriate, respond with "I apologize, but I need to transfer you to a real person to continue this conversation" and add (realtime) at the end
          8. If the customer wants to book an appointment or asks about booking, ALWAYS direct them to the booking link: ${process.env.NEXT_PUBLIC_BASE_URL}/booking/${chatBotDomain.User.bookingLink}
          9. Never try to book appointments directly - always use the booking link

          Right now you are talking to a customer for the first time. Start by giving them a warm welcome on behalf of ${chatBotDomain.name} and make them feel welcomed. Your first priority is to naturally collect their email address.
        `,
      },
      ...chat,
      {
        role: "user",
        content: message,
      },
    ]);

    const chatCompletion = { choices: chatCompletionResponse.choices };

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
