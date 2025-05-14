import {
  onGetChatMessages,
  onGetDomainChatRooms,
  onOwnerSendMessage,
  onRealTimeChat,
  onViewUnReadMessages,
} from "@/actions/conversation";
import { useChatContext } from "@/context/chat-context";
import { getMonthName, pusherClient } from "@/lib/utils";
import {
  ChatBotMessageSchema,
  ConversationSearchSchema,
} from "@/schemas/conversation-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export const useConversation = () => {
  const { register, watch } = useForm({
    resolver: zodResolver(ConversationSearchSchema),
    mode: "onChange",
  });
  const { setLoading: loadMessages, setChats, setChatRoom } = useChatContext();
  const [chatRooms, setChatRooms] = useState<
    {
      chatRoom: {
        id: string;
        createdAt: Date;
        message: {
          message: string;
          createdAt: Date;
          seen: boolean;
        }[];
      }[];
      email: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const search = watch(async (value) => {
      setLoading(true);
      try {
        if (value.domain) {
          const rooms = await onGetDomainChatRooms(value.domain);
          if (rooms) {
            setLoading(false);
            
            // Transform the data structure to match the expected format
            const transformedRooms = rooms.customers?.map(customer => ({
              chatRoom: customer.chatRooms.map(room => ({
                id: room.id,
                createdAt: room.createdAt,
                message: room.message.map(msg => ({
                  message: msg.content,
                  createdAt: msg.createdAt,
                  seen: msg.seen
                }))
              })),
              email: customer.email
            })) || [];
            
            setChatRooms(transformedRooms);
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
    return () => search.unsubscribe();
  }, [watch]);

  const onGetActiveChatMessages = async (id: string) => {
    try {
      loadMessages(true);
      const messages = await onGetChatMessages(id);
      if (messages) {
        setChatRoom(id);
        loadMessages(false);
        // Transform the messages to match the expected format
        const transformedMessages = messages[0].message.map(msg => ({
          message: msg.content,
          id: msg.id,
          role: msg.userId ? "user" : "assistant" as "user" | "assistant" | null,
          createdAt: msg.createdAt,
          seen: msg.seen
        }));
        setChats(transformedMessages);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return {
    register,
    chatRooms,
    loading,
    onGetActiveChatMessages,
  };
};

export const useChatTime = (createdAt: Date, roomId: string) => {
  const { chatRoom } = useChatContext();
  const [messageSentAt, setMessageSentAt] = useState<string>();
  const [urgent, setUrgent] = useState<boolean>(false);

  const onSetMessageRecievedDate = () => {
    const dt = new Date(createdAt);
    const current = new Date();
    const currentDate = current.getDate();
    const hr = dt.getHours();
    const min = dt.getMinutes();
    const date = dt.getDate();
    const month = dt.getMonth();
    const difference = currentDate - date;

    if (difference <= 0) {
      setMessageSentAt(`${hr}:${min}${hr > 12 ? "PM" : "AM"}`);
      if (current.getHours() - dt.getHours() < 2) {
        setUrgent(true);
      }
    } else {
      setMessageSentAt(`${date} ${getMonthName(month)}`);
    }
  };

  const onSeenChat = async () => {
    if (chatRoom == roomId && urgent) {
      await onViewUnReadMessages(roomId);
      setUrgent(false);
    }
  };

  useEffect(() => {
    onSeenChat();
  }, [chatRoom]);

  useEffect(() => {
    onSetMessageRecievedDate();
  }, []);

  return { messageSentAt, urgent, onSeenChat };
};

export const useChatWindow = () => {
  const { chats, loading, setChats, chatRoom } = useChatContext();
  const messageWindowRef = useRef<HTMLDivElement | null>(null);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(ChatBotMessageSchema),
    mode: "onChange",
  });
  const onScrollToBottom = () => {
    messageWindowRef.current?.scroll({
      top: messageWindowRef.current.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    onScrollToBottom();
  }, [chats, messageWindowRef]);

  useEffect(() => {
    if (chatRoom) {
      pusherClient.subscribe(chatRoom);
      pusherClient.bind("realtime-mode", (data: any) => {
        setChats((prev) => [...prev, data.chat]);
      });

      return () => {
        pusherClient.unbind("realtime-mode");
        pusherClient.unsubscribe(chatRoom);
      };
    }
  }, [chatRoom]);

  const onHandleSentMessage = handleSubmit(async (values) => {
    try {
      reset();
      if (values.content) {
        const message = await onOwnerSendMessage(
          chatRoom!,
          values.content,
          "assistant"
        );
        if (message && message.message && message.message.length > 0) {
          // Assuming the first message contains the necessary data
          const sentMessage = message.message[0];
          await onRealTimeChat(
            chatRoom!,
            sentMessage.content, // Use content instead of message
            sentMessage.id,
            "assistant"
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  return {
    messageWindowRef,
    register,
    onHandleSentMessage,
    chats,
    loading,
    chatRoom,
  };
};
