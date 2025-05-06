import { User, ChatBot, Billings } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import PremiumBadge from "@/icons/premium-badge";
import TabsMenu from "@/components/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { SideSheet } from "@/components/sheet";
import { Plus } from "lucide-react";
import HelpDesk from "@/components/forms/settings/help-desk";
import FilterQuestions from "@/components/forms/settings/filter-questions";
import KnowledgeBase from "@/components/forms/settings/knowledge-base";

type UserWithChatBot = User & {
  chatBot: ChatBot | null;
  subscription: Billings | null;
};

interface ChatbotSettingsProps {
  user: UserWithChatBot;
  disabled: {
    welcomeMessage: boolean;
    appearance: boolean;
  };
}

const HELP_DESK_TABS_MENU = [
  { value: "help desk", label: "Help Desk" },
  { value: "questions", label: "Questions" },
  { value: "knowledge base", label: "Knowledge Base" },
];

export function ChatbotSettings({ user, disabled }: ChatbotSettingsProps) {
  const chatBot = user.chatBot;

  return (
    <>
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
                  disabled={disabled.welcomeMessage}
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
                      disabled={disabled.appearance}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Text Color</label>
                    <input
                      type="color"
                      className="mt-1 block w-full"
                      defaultValue={chatBot?.textColor || "#000000"}
                      disabled={disabled.appearance}
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
          <TabsMenu
            triggers={HELP_DESK_TABS_MENU}
            button={
              <div className="flex-1 flex justify-end">
                <SideSheet
                  title="Add Knowledge Base Entry"
                  description="Create a new entry for your chatbot's knowledge base."
                  className="flex items-center gap-2 bg-purple px-4 py-2 text-black font-semibold rounded-lg text-sm"
                  trigger={
                    <>
                      <Plus size={20} className="text-white" />
                      <p className="text-white">Add Entry</p>
                    </>
                  }
                >
                  <KnowledgeBase id={user.id} plan={user.subscription?.plan || "STANDARD"} />
                </SideSheet>
              </div>
            }
          >
            <TabsContent value="help desk" className="w-full">
              <HelpDesk id={user.id} plan={user.subscription?.plan || "STANDARD"} />
            </TabsContent>
            <TabsContent value="questions">
              <FilterQuestions id={user.id} plan={user.subscription?.plan || "STANDARD"} />
            </TabsContent>
            <TabsContent value="knowledge base">
              <KnowledgeBase id={user.id} plan={user.subscription?.plan || "STANDARD"} />
            </TabsContent>
          </TabsMenu>
        </div>
      </div>
    </>
  );
} 