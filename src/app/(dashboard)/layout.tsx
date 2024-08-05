// src/app/(dashboard)/Layout.tsx
"use client";
import { onGetAllAccountDomains } from "@/actions/settings";
import SideBar from "@/components/sidebar";
import { ChatProvider } from "@/context/chat-context";
import { Domains } from "@/types/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [domains, setDomains] = useState<Domains>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const domainsData = await onGetAllAccountDomains(); // Assuming this function fetches domains
        setDomains(domainsData);
      } catch (error) {
        console.error("Error fetching domains:", error);
        // Handle error (e.g., setDomains(null) or display an error message)
      }
    };

    if (status !== "loading") {
      fetchData();
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <ChatProvider>
      <div className="flex h-screen w-full">
        <SideBar domains={domains} />
        <div className="w-full h-screen flex flex-col pl-20 md:pl-4">
          {children}
        </div>
      </div>
    </ChatProvider>
  );
};

export default Layout;
