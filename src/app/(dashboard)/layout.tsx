import { onLoginUser } from "@/actions/auth";
import SideBar from "@/components/sidebar";
import { ChatProvider } from "@/context/chat-context";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const Layout = async ({ children }: Props) => {
  const authenticated = await onLoginUser();
  if (!authenticated) return null;

  const domains = (authenticated.domain || []).map(domain => ({
    ...domain,
    icon: (domain as { icon?: string }).icon || 'default-icon.png',
  }));

  return (
    <ChatProvider>
      <div className="flex h-screen w-full">
        <SideBar domains={domains} />
        <div className="w-full h-screen overflow-y-auto">
          {children}
        </div>
      </div>
    </ChatProvider>
  );
};

export default Layout;
