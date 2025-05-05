import { cn, extractUUIDFromString, getMonthName } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = {
  message: {
    role: "assistant" | "user";
    content: string;
    link?: string;
  };
  createdAt?: Date;
};

const Bubble = ({ message, createdAt }: Props) => {
  const isUser = message.role === "user";
  const content = message.content || "";
  const link = message.link;
  let d = new Date();
  const image = extractUUIDFromString(content);
  console.log(link);

  return (
    <div
      className={`flex ${
        message.role === "assistant" ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.role === "assistant"
            ? "bg-gray-100"
            : "bg-purple text-white"
        }`}
      >
        {createdAt ? (
          <div className="flex gap-2 text-xs text-gray-600">
            <p>
              {createdAt.getDate()} {getMonthName(createdAt.getMonth())}
            </p>
            <p>
              {createdAt.getHours()}:{String(createdAt.getMinutes()).padStart(2, '0')}
              {createdAt.getHours() > 12 ? "PM" : "AM"}
            </p>
          </div>
        ) : (
          <p className="text-xs">
            {`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${
              d.getHours() > 12 ? "pm" : "am"
            }`}
          </p>
        )}
        <div 
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
          >
            Click here
          </a>
        )}
      </div>
    </div>
  );
};

export default Bubble;
