import React from "react";

type Props = {
  title: string;
  value: number;
  icon: React.ReactElement;
  sales?: boolean;
};

const DashboardCard = ({ icon, title, value, sales }: Props) => {
  return (
    <div className="rounded-lg flex flex-col gap-4 pr-7 pl-7 py-7 border-[1px] border-border bg-cream dark:bg-muted w-full">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <h2 className="font-bold text-xl text-gray-900 truncate">{title}</h2>
      </div>
      <p className="font-bold text-4xl text-gray-900">
        {sales && "$"}
        {value}
      </p>
    </div>
  );
};

export default DashboardCard;
