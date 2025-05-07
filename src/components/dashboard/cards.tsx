import React from "react";

type Props = {
  title: string;
  value: number;
  icon: JSX.Element;
  sales?: boolean;
};

const DashboardCard = ({ icon, title, value, sales }: Props) => {
  return (
    <div className=" rounded-lg flex flex-col gap-2 pr-7 pl-7 py-7 md:pl-7 md:pr-7 border-[1px] border-border bg-cream dark:bg-muted md:w-fit w-full">
      <div className="flex gap-2">
        {icon}
        <h2 className="font-bold text-xl">{title}</h2>
      </div>
      <p className="font-bold text-4xl">
        {sales && "$"}
        {value}
      </p>
    </div>
  );
};

export default DashboardCard;
