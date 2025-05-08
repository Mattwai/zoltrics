import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import * as React from "react";

type Props = {
  triggers: {
    label: string;
    icon?: React.ReactNode;
    count?: number;
  }[];
  children: React.ReactNode;
  className?: string;
  button?: React.ReactNode;
};

const TabsMenu = ({ triggers, children, className, button }: Props) => {
  return (
    <Tabs defaultValue={triggers[0].label} className="w-full">
      <TabsList className={cn("pr-5", className)}>
        {triggers.map((trigger, key) => (
          <TabsTrigger
            key={key}
            value={trigger.label}
            className="capitalize flex gap-2 font-semibold"
          >
            {trigger.icon && trigger.icon}
            {trigger.label}
            {trigger.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {trigger.count}
              </span>
            )}
          </TabsTrigger>
        ))}
        {button}
      </TabsList>
      {children}
    </Tabs>
  );
};

export default TabsMenu;
