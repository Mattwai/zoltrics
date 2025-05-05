import { cn, extractUUIDFromString, getMonthName } from "@/lib/utils";
import Link from "next/link";

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
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2 rounded-lg p-3",
          isUser
            ? "bg-royalPurple text-white"
            : "bg-porcelain text-black"
        )}
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
        <p className="text-sm">{content}</p>
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
