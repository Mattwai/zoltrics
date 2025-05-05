import { SIDE_BAR_MENU } from "@/constants/menu";

import SettingsIcon from "@/icons/settings-icon";
import { LogOut, Menu } from "lucide-react";
import DomainMenu from "./domain-menu";
import MenuItem from "./menu-item";
import ChatIcon from "@/icons/chat-icon";
import HelpDeskIcon from "@/icons/help-desk-icon";
import TimerIcon from "@/icons/timer-icon";

type MinMenuProps = {
  onShrink(): void;
  current: string;
  onSignOut(): void;
  domains:
    | {
        id: string;
        name: string;
        icon: string | null;
      }[]
    | null
    | undefined;
};

export const MinMenu = ({
  onShrink,
  current,
  onSignOut,
  domains,
}: MinMenuProps) => {
  return (
    <div className="p-3 flex flex-col items-center h-full">
      <span className="animate-fade-in opacity-0 delay-300 fill-mode-forwards cursor-pointer">
        <Menu
          className="cursor-pointer animate-fade-in opacity-0 delay-300 fill-mode-forwards"
          onClick={onShrink}
        />
      </span>
      <div className="animate-fade-in opacity-0 delay-300 fill-mode-forwards flex flex-col justify-between h-full pt-10">
        <div className="flex flex-col">
          {SIDE_BAR_MENU.map((menu, key) => (
            <MenuItem size="min" {...menu} key={key} current={current} />
          ))}
          {/* <DomainMenu min domains={domains} /> */}
        </div>
        <div className="flex flex-col">
          <MenuItem
            size="min"
            label="Chatbot"
            icon={<ChatIcon />}
            path="chatbot-settings"
          />
          <MenuItem
            size="min"
            label="Products"
            icon={<HelpDeskIcon />}
            path="product-settings"
          />
          <MenuItem
            size="min"
            label="Appointments"
            icon={<TimerIcon />}
            path="appointment-settings"
          />
          <MenuItem
            size="min"
            label="General"
            icon={<SettingsIcon />}
            path="settings"
          />
          <MenuItem
            size="min"
            label="Sign out"
            icon={<LogOut />}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </div>
  );
};
