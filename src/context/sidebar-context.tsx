"use client";
import {
  onGetConversationMode,
  onToggleRealtime,
} from "@/actions/conversation";
import { useToast } from "@/components/ui/use-toast";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useChatContext } from "./chat-context";

const useSideBar = () => {
  const [expand, setExpand] = useState<boolean | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [realtime, setRealtime] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { data: session } = useSession();
  const { chatRoom } = useChatContext();

  const onActivateRealtime = async (e: any) => {
    try {
      const realtime = await onToggleRealtime(
        chatRoom!,
        e.target.ariaChecked == "true" ? false : true
      );
      if (realtime) {
        setRealtime(realtime.chatRoom.status?.isOpen || false);
        toast({
          title: "Success",
          description: realtime.message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onGetCurrentMode = useCallback(async () => {
    setLoading(true);
    const mode = await onGetConversationMode(chatRoom!);
    if (mode) {
      setRealtime(mode.live);
      setLoading(false);
    }
  }, [chatRoom]);

  useEffect(() => {
    if (chatRoom) {
      onGetCurrentMode();
    }
  }, [chatRoom, onGetCurrentMode]);

  const page = pathname.split("/").pop();
  const onSignOut = async () => {
    try {
      await signOut();
      router.push("/"); // Redirect after sign-out
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const onExpand = () => setExpand((prev) => !prev);

  return {
    expand,
    onExpand,
    page,
    onSignOut,
    realtime,
    onActivateRealtime,
    chatRoom,
    loading,
  };
};

export default useSideBar;
