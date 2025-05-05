import { SIDE_BAR_MENU } from "@/constants/menu";
import SettingsIcon from "@/icons/settings-icon";
import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import MenuItem from "./menu-item";
import ChatIcon from "@/icons/chat-icon";
import HelpDeskIcon from "@/icons/help-desk-icon";
import TimerIcon from "@/icons/timer-icon";

type Props = {
  onExpand(): void;
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

const MaxMenu = ({ current, domains, onExpand, onSignOut }: Props) => {
  return (
    <div className="py-3 px-4 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <Image
          src="/images/logo.png"
          alt="LOGO"
          sizes="100vw"
          className="animate-fade-in opacity-0 delay-300 fill-mode-forwards"
          style={{
            width: "50%",
            height: "auto",
          }}
          width={0}
          height={0}
        />
        <Menu
          className="cursor-pointer animate-fade-in opacity-0 delay-300 fill-mode-forwards"
          onClick={onExpand}
        />
      </div>
      <div className="animate-fade-in opacity-0 delay-300 fill-mode-forwards flex flex-col justify-between h-full pt-10">
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-3">MENU</p>
          {SIDE_BAR_MENU.map((menu, key) => (
            <MenuItem size="max" {...menu} key={key} current={current} />
          ))}
          {/* <DomainMenu domains={domains} /> */}
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-3">SETTINGS</p>
          <MenuItem
            size="max"
            label="Chatbot"
            icon={<ChatIcon />}
            path="chatbot-settings"
          />
          <MenuItem
            size="max"
            label="Products"
            icon={<HelpDeskIcon />}
            path="product-settings"
          />
          <MenuItem
            size="max"
            label="Appointments"
            icon={<TimerIcon />}
            path="appointment-settings"
          />
          <MenuItem
            size="max"
            label="General"
            icon={<SettingsIcon />}
            path="settings"
          />
          <MenuItem
            size="max"
            label="Sign out"
            icon={<LogOut />}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </div>
  );
};

export default MaxMenu;
