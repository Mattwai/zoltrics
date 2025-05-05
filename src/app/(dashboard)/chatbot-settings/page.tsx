import { onGetUser } from "@/actions/settings";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import InfoBar from "@/components/infobar";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/settings/use-settings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DomainSettingsSchema } from "@/schemas/settings-schema";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { onUpdateWelcomeMessage } from "@/actions/settings";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import PremiumBadge from "@/icons/premium-badge";
import TabsMenu from "@/components/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { HELP_DESK_TABS_MENU } from "@/constants/menu";
import HelpDesk from "@/components/forms/settings/help-desk";
import FilterQuestions from "@/components/forms/settings/filter-questions";
import KnowledgeBase from "@/components/forms/settings/knowledge-base";
import { User } from "@prisma/client";

type UserWithChatBot = User & {
  chatBot: {
    welcomeMessage: string;
    background: string;
    textColor: string;
    helpdesk: any[];
  };
};

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  // Fetch user details including chatbot settings
  const user = await onGetUser();
  if (!user) return null;

  const chatBot = user.chatBot;

  return (
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0">
        <div className="flex flex-col gap-8 pb-10">
          <div className="flex flex-col gap-3">
            <div className="flex gap-4 items-center">
              <h2 className="font-bold text-2xl">Chatbot Settings</h2>
              <div className="flex gap-1 bg-cream rounded-full px-3 py-1 text-xs items-center font-bold">
                <PremiumBadge />
                Premium
              </div>
            </div>
            <Separator orientation="horizontal" />
            <div className="grid md:grid-cols-2">
              <div className="col-span-1 flex flex-col gap-5 order-last md:order-first">
                <div className="space-y-4">
                  <h3 className="font-semibold">Welcome Message</h3>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    placeholder="Enter your chatbot's welcome message..."
                    defaultValue={chatBot?.welcomeMessage || "Hello! How can I help you with your booking today?"}
                  />
                  <p className="text-sm text-gray-500">
                    This message will be shown to users when they first interact with your chatbot.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Appearance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Background Color</label>
                      <input
                        type="color"
                        className="mt-1 block w-full"
                        defaultValue={chatBot?.background || "#ffffff"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Text Color</label>
                      <input
                        type="color"
                        className="mt-1 block w-full"
                        defaultValue={chatBot?.textColor || "#000000"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="py-5 mb-10 flex flex-col gap-5 items-start">
            <div className="flex flex-col gap-2">
              <h2 className="font-bold text-2xl">Bot Training</h2>
              <p className="text-sm font-light">
                Set FAQ questions, create questions for capturing lead information and
                train your bot to act the way you want it to.
              </p>
            </div>
            <TabsMenu triggers={HELP_DESK_TABS_MENU}>
              <TabsContent value="help desk" className="w-full">
                <HelpDesk id={user.id} />
              </TabsContent>
              <TabsContent value="questions">
                <FilterQuestions id={user.id} />
              </TabsContent>
              <TabsContent value="knowledge base">
                <KnowledgeBase id={user.id} />
              </TabsContent>
            </TabsMenu>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page; 