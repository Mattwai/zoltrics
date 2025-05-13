"use client";
import { useChatBot } from "@/hooks/chatbot/use-chatbot";
import { BotIcon } from "@/icons/bot-icon";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { BotWindow } from "./window";
import Image from "next/image";

type Props = {
  userId?: string;
  initialChatBot?: {
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
  };
};

const AiChatBot = ({ userId, initialChatBot }: Props) => {
  const {
    onOpenChatBot,
    botOpened,
    onChats,
    register,
    onStartChatting,
    onAiTyping,
    messageWindowRef,
    currentBot,
    loading,
    onRealTime,
    setOnChats,
    errors,
  } = useChatBot(userId, initialChatBot);

  return (
    <div className="h-screen flex flex-col justify-end items-end gap-4">
      {botOpened && currentBot && (
        <BotWindow
          errors={errors}
          setChat={setOnChats}
          realtimeMode={onRealTime}
          helpdesk={currentBot.helpdesk || []}
          domainName={currentBot.name || "BookerBuddy"}
          ref={messageWindowRef}
          help={currentBot.chatBot?.helpdesk}
          theme={currentBot.chatBot?.background}
          textColor={currentBot.chatBot?.textColor}
          chats={onChats}
          register={register}
          onChat={onStartChatting}
          onResponding={onAiTyping}
        />
      )}
      <div
        className={cn(
          "fixed bottom-6 right-6 rounded-full cursor-pointer shadow-xl w-18 h-18 flex items-center justify-center transition-all duration-200 group z-[100]",
          botOpened 
            ? "bg-black hover:bg-gray-800" 
            : "bg-indigo-600 hover:bg-indigo-700",
          loading ? "invisible" : "visible"
        )}
        style={{ width: '64px', height: '64px' }}
        onClick={onOpenChatBot}
      >
        {!botOpened ? (
          <MessageSquare className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Image
              src="/images/bookerbuddy-icon.png"
              width={36}
              height={36}
              alt="BookerBuddy"
              className="group-hover:scale-110 transition-transform"
              priority
            />
          </div>
        )}
        
        {!botOpened && (
          <span className="absolute -top-12 right-0 bg-white text-slate-800 px-3 py-1.5 rounded-lg shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Chat with us
          </span>
        )}
      </div>
    </div>
  );
};

export default AiChatBot;
