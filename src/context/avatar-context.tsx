// AvatarContext.tsx
"use client";
import { onGetProfileIcon, onUpdateProfileIcon } from "@/actions/settings";
import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";

// Define context type
type AvatarContextType = {
  avatarSrc: string;
  updateAvatar: (newAvatar: string) => void;
};

// Create context
const AvatarContext = createContext<AvatarContextType | undefined>(undefined);
const imagePath = "/images/avatar";

// Custom hook to use AvatarContext
export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return context;
};

// Avatar provider component
export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session } = useSession();
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const profileIcon = await onGetProfileIcon();
        if (typeof profileIcon === "string") {
          setAvatarSrc(`${imagePath}/${profileIcon}`);
        }
      } catch (error) {
        console.error("Error fetching profile icon:", error);
      }
    };

    if (session?.user) {
      fetchAvatar();
    }
  }, [session]);

  const updateAvatar = async (newAvatar: string) => {
    await onUpdateProfileIcon(newAvatar);
    setAvatarSrc(`${imagePath}/${newAvatar}`);
  };

  return (
    <AvatarContext.Provider value={{ avatarSrc, updateAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
};

export default AvatarContext;
