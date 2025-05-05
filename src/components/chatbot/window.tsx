import { BOT_TABS_MENU } from "@/constants/menu";
import { ChatBotMessageProps } from "@/schemas/conversation-schema";
import { Paperclip, Send } from "lucide-react";
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
      <div className="h-[670px] w-[450px] flex flex-col bg-white rounded-xl mr-[80px] border-[1px] overflow-hidden">
        <div className="flex justify-between px-4 pt-4">
          <div className="flex gap-2">
            <div className="flex items-start flex-col">
              <h3 className="text-lg font-bold leading-none">
                Sales Rep - BookerBuddy
              </h3>
              <p className="text-sm">{domainName?.split(".com")[0] || "BookerBuddy"}</p>
              {realtimeMode?.mode && (
                <RealTimeMode
                  setChats={setChat}
                  chatRoomId={realtimeMode.chatroom}
                />
              )}
            </div>
          </div>
        </div>
        <TabsMenu
          triggers={BOT_TABS_MENU}
          className=" bg-transparent border-[1px] border-border m-2"
        >
          <TabsContent value="chat">
            <Separator orientation="horizontal" />
            <div className="flex flex-col h-full">
              <div
                style={{
                  background: theme || "#ffffff",
                  color: textColor || "#000000",
                }}
                className="px-3 flex h-[400px] flex-col py-5 gap-3 chat-window overflow-y-auto"
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
                    // Clear the input after submission
                    const input = e.currentTarget.querySelector('input');
                    if (input) {
                      input.value = '';
                    }
                  }
                }}
                className="flex px-3 py-1 flex-col flex-1 bg-porcelain"
              >
                <div className="flex justify-between">
                  <Input
                    {...register("content")}
                    placeholder="Type your message..."
                    className="focus-visible:ring-0 flex-1 p-0 focus-visible:ring-offset-0 bg-porcelain rounded-none outline-none border-none"
                  />
                  <Button type="submit" className="mt-3">
                    <Send />
                  </Button>
                </div>
                <Label htmlFor="bot-image">
                  <Paperclip />
                  <Input
                    {...register("image")}
                    type="file"
                    id="bot-image"
                    className="hidden"
                  />
                </Label>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="helpdesk">
            <div className="h-[485px] overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-4">
              <div>
                <CardTitle>Help Desk</CardTitle>
                <CardDescription>
                  Browse from a list of questions people usually ask.
                </CardDescription>
              </div>
              <Separator orientation="horizontal" />

              {helpdesk?.map((desk) => (
                <Accordion
                  key={desk.id}
                  trigger={desk.question}
                  content={desk.answer}
                />
              ))}
            </div>
          </TabsContent>
        </TabsMenu>
        <div className="flex justify-center ">
          <p className="text-gray-400 text-xs">Powered By BookerBuddy</p>
        </div>
      </div>
    );
  }
);

BotWindow.displayName = "BotWindow";
