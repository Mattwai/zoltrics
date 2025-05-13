import { onAiChatBotAssistant, onGetCurrentChatBot } from "@/actions/bot";
import { postToParent, pusherClient } from "@/lib/utils";
import {
  ChatBotMessageProps,
  ChatBotMessageSchema,
} from "@/schemas/conversation-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export const useChatBot = (userId?: string, initialChatBot?: {
  name: string;
  chatBot: {
    id: string;
    welcomeMessage: string | null;
    background: string | null;
    textColor: string | null;
    helpdesk: boolean;
  } | null;
  helpdesk: {
    id: string;
    question: string;
    answer: string;
    domainId: string | null;
  }[];
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatBotMessageProps>({
    resolver: zodResolver(ChatBotMessageSchema),
  });
  const [currentBot, setCurrentBot] = useState<
    | {
        name: string;
        chatBot: {
          id: string;
          welcomeMessage: string | null;
          background: string | null;
          textColor: string | null;
          helpdesk: boolean;
        } | null;
        helpdesk: {
          id: string;
          question: string;
          answer: string;
          domainId: string | null;
        }[];
      }
    | undefined
  >(initialChatBot);
  const messageWindowRef = useRef<HTMLDivElement | null>(null);
  const [botOpened, setBotOpened] = useState<boolean>(false);
  const onOpenChatBot = () => {
    setBotOpened((prev) => {
      const newState = !prev;
      // Send welcome message when opening the chatbot
      if (newState && currentBot?.chatBot?.welcomeMessage) {
        setOnChats((prev) => [
          ...prev,
          {
            role: "assistant",
            content: currentBot.chatBot.welcomeMessage
          }
        ]);
      }
      return newState;
    });
  };
  const [loading, setLoading] = useState<boolean>(!initialChatBot);
  const [onChats, setOnChats] = useState<
    { role: "assistant" | "user"; content: string; link?: string }[]
  >([]);
  const [onAiTyping, setOnAiTyping] = useState<boolean>(false);
  const [currentBotId, setCurrentBotId] = useState<string>();
  const [onRealTime, setOnRealTime] = useState<
    { chatroom: string; mode: boolean } | undefined
  >(undefined);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onScrollToBottom = () => {
    messageWindowRef.current?.scroll({
      top: messageWindowRef.current.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    onScrollToBottom();
  }, [onChats, messageWindowRef]);

  useEffect(() => {
    postToParent(
      JSON.stringify({
        width: botOpened ? 550 : 80,
        height: botOpened ? 800 : 80,
      })
    );
  }, [botOpened]);

  let limitRequest = 0;

  const onGetDomainChatBot = async (id: string) => {
    setCurrentBotId(id);
    const chatbot = await onGetCurrentChatBot(id);
    if (chatbot) {
      setCurrentBot({
        name: chatbot.user?.name || "BookerBuddy",
        chatBot: {
          id: chatbot.id,
          welcomeMessage: chatbot.welcomeMessage,
          background: chatbot.background,
          textColor: chatbot.textColor,
          helpdesk: chatbot.helpdesk,
        },
        helpdesk: chatbot.user?.helpdesk.map(h => ({
          id: h.id,
          question: h.question,
          answer: h.answer,
          domainId: null
        })) || [],
      });
      setLoading(false);
    }
  };
  
  const onGetUserChatBot = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/${userId}/chatbot`);
      if (response.ok) {
        const data = await response.json();
        console.log("Chatbot data received:", data);
        console.log("Helpdesk questions received:", data.helpdeskQuestions);
        
        // Set the current bot with the returned data
        setCurrentBot({
          name: data.name || "BookerBuddy",
          chatBot: {
            id: userId, // Use userId as the chatbot ID if none provided
            welcomeMessage: data.welcomeMessage,
            background: data.background,
            textColor: data.textColor,
            helpdesk: data.helpdesk || false,
          },
          helpdesk: data.helpdeskQuestions || [],
        });
        
        console.log("Current bot after setting:", {
          name: data.name || "BookerBuddy",
          chatBotHelpdesk: data.helpdesk || false,
          helpdeskLength: (data.helpdeskQuestions || []).length
        });
        
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user chatbot:", error);
    }
  };

  useEffect(() => {
    if (initialChatBot) {
      setLoading(false);
    } else if (userId) {
      onGetUserChatBot(userId);
    } else {
      window.addEventListener("message", (e) => {
        console.log(e.data);
        const botid = e.data;
        if (limitRequest < 1 && typeof botid == "string") {
          onGetDomainChatBot(botid);
          limitRequest++;
        }
      });
    }
  }, [userId, initialChatBot]);

  const onStartChatting = handleSubmit(async (values) => {
    if (!values.content?.trim()) {
      return;
    }

    const userMessage = {
      role: "user" as const,
      content: values.content.trim(),
    };

    // Clear the input immediately
    reset({ content: '' });

    // Add user message to chat
    if (!onRealTime?.mode) {
      setOnChats((prev) => [...prev, userMessage]);
    }

    setOnAiTyping(true);

    try {
      let response;
      
      if (userId) {
        // If we have a userId, use the user-specific chatbot assistant API
        console.log("Sending message to assistant:", values.content);
        const userAssistantResponse = await fetch(`/api/user/${userId}/chatbot/assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: values.content,
            chat: onChats,
          }),
        });

        const data = await userAssistantResponse.json();
        console.log("Received assistant response:", data);

        if (!userAssistantResponse.ok) {
          throw new Error(data.error || "Failed to get response from assistant");
        }

        if (data.error) {
          throw new Error(data.error);
        }

        response = {
          response: {
            role: "assistant" as const,
            content: data.response.content
          }
        };
      } else if (currentBotId) {
        // Otherwise use the domain-based chatbot API
        response = await onAiChatBotAssistant(
          currentBotId,
          onChats,
          "user",
          values.content
        );
      }

      setOnAiTyping(false);
      
      if (response) {
        setOnChats((prev) => [...prev, response.response]);
      }
    } catch (error) {
      console.error("Error in chatbot interaction:", error);
      setOnAiTyping(false);
      // Add error message to chat
      setOnChats((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: error instanceof Error ? error.message : "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        },
      ]);
    }
  });

  return {
    botOpened,
    onOpenChatBot,
    onStartChatting,
    onChats,
    register,
    onAiTyping,
    messageWindowRef,
    currentBot,
    loading,
    setOnChats,
    onRealTime,
    errors,
  };
};

export const useRealTime = (
  chatRoom: string,
  setChats: React.Dispatch<
    React.SetStateAction<
      {
        role: "user" | "assistant";
        content: string;
        link?: string | undefined;
      }[]
    >
  >
) => {
  const counterRef = useRef(1);

  // useEffect(() => {
  //   pusherClient.subscribe(chatRoom);
  //   pusherClient.bind("realtime-mode", (data: any) => {
  //     console.log("✅", data);
  //     if (counterRef.current !== 1) {
  //       setChats((prev: any) => [
  //         ...prev,
  //         {
  //           role: data.chat.role,
  //           content: data.chat.message,
  //         },
  //       ]);
  //     }
  //     counterRef.current += 1;
  //   });
  //   return () => {
  //     pusherClient.unbind("realtime-mode");
  //     pusherClient.unsubscribe(chatRoom);
  //   };
  // }, []);
};
