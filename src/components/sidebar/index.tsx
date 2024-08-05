"use client";
import useSideBar from "@/context/sidebar-context";
import { cn } from "@/lib/utils";
import { Domains } from "@/types/types";
import MaxMenu from "./maximised-menu";

type Props = {
  domains: Domains;
};

const SideBar = ({ domains }: Props) => {
  const { page, onSignOut } = useSideBar();

  return (
    <div
      className={cn(
        "bg-cream dark:bg-neutral-950 h-full w-[60px] fill-mode-forwards fixed md:relative",
        "animate-open-sidebar"
      )}
    >
      <MaxMenu domains={domains} current={page!} onSignOut={onSignOut} />
    </div>
  );
};

export default SideBar;
