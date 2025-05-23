import { onGetUser } from "@/actions/settings";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import InfoBar from "@/components/infobar";
import { Separator } from "@/components/ui/separator";
import PremiumBadge from "@/icons/premium-badge";
import TabsMenu from "@/components/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { HELP_DESK_TABS_MENU } from "@/constants/menu";
import HelpDesk from "@/components/forms/settings/help-desk";
import FilterQuestions from "@/components/forms/settings/filter-questions";
import KnowledgeBase from "@/components/forms/settings/knowledge-base";
import { SideSheet } from "@/components/sheet";
import { Plus } from "lucide-react";
import { User, Billings, ChatBot } from "@prisma/client";
import { Plans } from "@/types/prisma";
import { checkChatbotFeature } from "@/lib/subscription-checks";

type UserWithChatBot = User & {
  chatBot: ChatBot | null;
  subscription: Billings | null;
};

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  // Fetch user details including chatbot settings
  const user = await onGetUser();
  if (!user) return null;

  const chatBot = user.chatBot;
  const plan = user.subscription?.plan || "STANDARD";

  // Check feature availability
  const canCustomiseWelcome = checkChatbotFeature(plan as Plans, "welcomeMessage");
  const canCustomiseAppearance = checkChatbotFeature(plan as Plans, "appearance");
  const canUseAI = checkChatbotFeature(plan as Plans, "aiPowered");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4">
        <InfoBar />
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex gap-4 items-center">
            </div>
            <Separator orientation="horizontal" />
            <div className="w-full">
              {!canUseAI && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    AI-powered chatbot is only available on the Business plan. Upgrade to unlock advanced AI capabilities.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold">Welcome Message</h3>
                  <textarea
                    className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                    rows={4}
                    placeholder="Enter your chatbot's welcome message..."
                    defaultValue={chatBot?.welcomeMessage || "Hello! How can I help you with your booking today?"}
                    disabled={!canCustomiseWelcome}
                  />
                  {!canCustomiseWelcome && (
                    <p className="text-sm text-amber-600">
                      Upgrade to Professional or Business plan to customise the welcome message.
                    </p>
                  )}
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
                        className="mt-1 block w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        defaultValue={chatBot?.background || "#ffffff"}
                        disabled={!canCustomiseAppearance}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Text Color</label>
                      <input
                        type="color"
                        className="mt-1 block w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        defaultValue={chatBot?.textColor || "#000000"}
                        disabled={!canCustomiseAppearance}
                      />
                    </div>
                  </div>
                  {!canCustomiseAppearance && (
                    <p className="text-sm text-amber-600">
                      Upgrade to Professional or Business plan to customise the chatbot appearance.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 items-start">
            <TabsMenu
              triggers={HELP_DESK_TABS_MENU}
            >
              <TabsContent value="help desk" className="w-full">
                <HelpDesk id={user.id} plan={plan as Plans} />
              </TabsContent>
              <TabsContent value="questions">
                <FilterQuestions id={user.id} plan={plan as Plans} />
              </TabsContent>
              <TabsContent value="knowledge base">
                <KnowledgeBase id={user.id} plan={plan as Plans} />
              </TabsContent>
            </TabsMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page; 