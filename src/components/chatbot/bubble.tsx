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
  let d = new Date();
  const image = extractUUIDFromString(message.content);
  console.log(message.link);

  return (
    <div
      className={cn(
        "flex gap-2 items-end",
        message.role == "assistant" ? "self-start" : "self-end flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 min-w-[200px] max-w-[300px] p-4 rounded-t-md",
          message.role == "assistant"
            ? "bg-muted rounded-r-md"
            : "bg-royalPurple rounded-l-md"
        )}
      >
        {createdAt ? (
          <div className="flex gap-2 text-xs text-gray-600">
            <p>
              {createdAt.getDate()} {getMonthName(createdAt.getMonth())}
            </p>
            <p>
              {createdAt.getHours()}:{createdAt.getMinutes()}
              {createdAt.getHours() > 12 ? "PM" : "AM"}
            </p>
          </div>
        ) : (
          <p className="text-xs">
            {`${d.getHours()}:${d.getMinutes()} ${
              d.getHours() > 12 ? "pm" : "am"
            }`}
          </p>
        )}
        <p className="text-sm">
          {message.content.replace("(complete)", " ")}
          {message.link && (
            <Link
              className="underline font-bold pl-2"
              href={message.link}
              target="_blank"
            >
              Your Link
            </Link>
          )}
        </p>
      </div>
    </div>
  );
};

export default Bubble;
