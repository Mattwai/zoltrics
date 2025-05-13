import { BOT_TABS_MENU } from "@/constants/menu";
import { ChatBotMessageProps } from "@/schemas/conversation-schema";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import React, { forwardRef } from "react";
import { UseFormRegister } from "react-hook-form";
import Accordion from "../accordian";
import TabsMenu from "../tabs/index";
import { Button } from "../ui/button";
import { CardDescription, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { TabsContent } from "../ui/tabs";
import Bubble from "./bubble";
import RealTimeMode from "./real-time";
import { Responding } from "./responding";
import Image from "next/image";

type Props = {
  errors: any;
  register: UseFormRegister<ChatBotMessageProps>;
  chats: { role: "assistant" | "user"; content: string; link?: string }[];
  onChat(): void;
  onResponding: boolean;
  domainName: string;
  theme?: string | null;
  textColor?: string | null;
  help?: boolean;
  realtimeMode:
    | {
        chatroom: string;
        mode: boolean;
      }
    | undefined;
  helpdesk: {
    id: string;
    question: string;
    answer: string;
    domainId: string | null;
  }[];
  setChat: React.Dispatch<
    React.SetStateAction<
      {
        role: "user" | "assistant";
        content: string;
        link?: string | undefined;
      }[]
    >
  >;
};

export const BotWindow = forwardRef<HTMLDivElement, Props>(
  (
    {
      errors,
      register,
      chats,
      onChat,
      onResponding,
      domainName,
      helpdesk,
      realtimeMode,
      setChat,
      textColor,
      theme,
      help,
    },
    ref
  ) => {
    return (
      <div className="h-[670px] w-[450px] flex flex-col bg-white rounded-xl mr-[80px] border-[1px] shadow-lg overflow-hidden">
        <div className="flex justify-between px-5 py-4 bg-black text-white">
          <div className="flex gap-3 items-center">
            <div className="relative flex-shrink-0">
              <Image 
                src="/images/bookerbuddy-icon.png" 
                width={32} 
                height={32} 
                alt="BookerBuddy"
                className="z-10 relative"
              />
            </div>
            <div className="flex items-start flex-col">
              <h3 className="text-lg font-bold leading-none">
                AI Sales Assistant
              </h3>
              <p className="text-sm text-gray-200 mt-1">
                {domainName?.split(".com")[0] || "BookerBuddy"}
                {realtimeMode?.mode && (
                  <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                    Live
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <TabsMenu
          triggers={BOT_TABS_MENU}
          className="bg-transparent border-[1px] border-border m-2"
        >
          <TabsContent value="chat">
            <Separator orientation="horizontal" />
            <div className="flex flex-col h-full">
              <div
                style={{
                  background: theme || "#ffffff",
                  color: textColor || "#000000",
                }}
                className="px-3 flex h-[420px] flex-col py-5 gap-3 chat-window overflow-y-auto"
                ref={ref}
              >
                {chats?.map((chat, key) => (
                  <Bubble key={key} message={chat} />
                ))}
                {onResponding && <Responding />}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onChat) {
                    onChat();
                    const input = e.currentTarget.querySelector('input');
                    if (input) {
                      input.value = '';
                    }
                  }
                }}
                className="flex px-4 py-3 flex-col flex-1 bg-slate-50 border-t"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 relative">
                    <Input
                      {...register("content")}
                      placeholder="Type your message..."
                      className="focus-visible:ring-1 focus-visible:ring-indigo-400 pl-10 pr-2 py-2 rounded-full focus-visible:ring-offset-0 bg-white border border-slate-200"
                    />
                    <MessageSquare className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                  <Button type="submit" className="ml-2 rounded-full w-10 h-10 p-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex justify-center mt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium">Powered by</span>
                    <div className="flex items-center">
                      <Image 
                        src="/images/bookerbuddy-icon.png"
                        width={16}
                        height={16}
                        alt="BookerBuddy"
                        className="mr-1"
                      />
                      <span className="font-medium">BookerBuddy</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </TabsContent>
          <TabsContent value="help">
            <div className="px-3 h-[450px] overflow-y-auto py-3 space-y-3">
              <CardTitle>Common Questions</CardTitle>
              <CardDescription>
                Find the answers to common questions about our services
              </CardDescription>
              {helpdesk.length > 0 ? (
                <Accordion title="FAQs" helpdesks={helpdesk} />
              ) : (
                <p className="text-center py-3 text-sm">
                  No questions yet, please check back later
                </p>
              )}
            </div>
          </TabsContent>
        </TabsMenu>
      </div>
    );
  }
);

BotWindow.displayName = "BotWindow";
