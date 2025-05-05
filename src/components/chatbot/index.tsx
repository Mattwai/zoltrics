"use client";
import { useChatBot } from "@/hooks/chatbot/use-chatbot";
import { BotIcon } from "@/icons/bot-icon";
import { cn } from "@/lib/utils";
import { BotWindow } from "./window";

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
          "rounded-full relative cursor-pointer shadow-md w-20 h-20 flex items-center justify-center bg-royalPurple",
          loading ? "invisible" : "visible"
        )}
        onClick={onOpenChatBot}
      >
        <BotIcon />
      </div>
    </div>
  );
};

export default AiChatBot;
