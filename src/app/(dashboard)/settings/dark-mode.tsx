"use client";
import { useThemeMode } from "@/hooks/settings/use-settings";
import { cn } from "@/lib/utils";
import Section from "@/components/section-label";
import { DarkMode } from "@/components/themes/dark-mode";
import { LightMode } from "@/components/themes/light-mode";
import { SystemMode } from "@/components/themes/system-mode";

type Props = {};

const DarkModetoggle = (props: Props) => {
  const { setTheme, theme } = useThemeMode();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Interface Theme"
          message="Select or customise your UI theme "
        />
      </div>
      <div className="lg:col-span-4 flex lg:flex-row flex-col items-start gap-5">
        <div
          className={cn(
            "rounded-2xl overflow-hidden cursor-pointer border-4 border-transparent",
            theme == "system" && "border-purple"
          )}
          onClick={() => setTheme("system")}
        >
          <SystemMode />
        </div>
        <div
          className={cn(
            "rounded-2xl overflow-hidden cursor-pointer border-4 border-transparent",
            theme == "light" && "border-purple"
          )}
          onClick={() => setTheme("light")}
        >
          <LightMode />
        </div>
        <div
          className={cn(
            "rounded-2xl overflow-hidden cursor-pointer border-4 border-transparent",
            theme == "dark" && "border-purple"
          )}
          onClick={() => setTheme("dark")}
        >
          <DarkMode />
        </div>
      </div>
    </div>
  );
};

export default DarkModetoggle;
