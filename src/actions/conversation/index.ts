"use server";

import { client } from "@/lib/prisma";
import { pusherServer } from "@/lib/utils";

export const onToggleRealtime = async (id: string, state: boolean) => {
  try {
    const chatRoom = await client.chatRoom.update({
      where: {
        id,
      },
      data: {
        status: {
          upsert: {
            create: {
              isOpen: state
            },
            update: {
              isOpen: state
            }
          }
        }
      },
      include: {
        status: true
      }
    });

    if (chatRoom) {
      return {
        status: 200,
        message: chatRoom.status?.isOpen
          ? "Realtime mode enabled"
          : "Realtime mode disabled",
        chatRoom,
      };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetConversationMode = async (id: string) => {
  try {
    const mode = await client.chatRoom.findUnique({
      where: {
        id,
      },
      include: {
        status: true,
      },
    });
    console.log(mode);
    return mode?.status?.isOpen !== undefined ? 
      { live: mode.status.isOpen } : 
      { live: false };
  } catch (error) {
    console.log(error);
  }
};

export const onGetDomainChatRooms = async (id: string) => {
  try {
    const domains = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        customers: {
          select: {
            email: true,
            chatRooms: {
              select: {
                createdAt: true,
                id: true,
                message: {
                  select: {
                    content: true,
                    createdAt: true,
                    seen: true,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (domains) {
      return domains;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetChatMessages = async (id: string) => {
  try {
    const messages = await client.chatRoom.findMany({
      where: {
        id,
      },
      include: {
        status: true,
        message: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            seen: true,
            userId: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (messages) {
      return messages;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onViewUnReadMessages = async (id: string) => {
  try {
    await client.chatMessage.updateMany({
      where: {
        chatRoomId: id,
      },
      data: {
        seen: true,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const onRealTimeChat = async (
  chatroomId: string,
  message: string,
  id: string,
  role: "assistant" | "user"
) => {
  pusherServer.trigger(chatroomId, "realtime-mode", {
    chat: {
      message,
      id,
      role,
    },
  });
};

export const onOwnerSendMessage = async (
  chatroom: string,
  message: string,
  role: "assistant" | "user"
) => {
  try {
    const chat = await client.chatRoom.update({
      where: {
        id: chatroom,
      },
      data: {
        message: {
          create: {
            content: message,
            // We can store the role information in userId field or add a comment
            // saying that 'role' field should be added to the schema
          },
        },
      },
      select: {
        message: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            seen: true,
            userId: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (chat) {
      return chat;
    }
  } catch (error) {
    console.log(error);
  }
};
