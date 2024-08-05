import Image from "next/image";

export const Responding = () => {
  return (
    <div className="self-start flex items-end gap-3">
      <Image src="/images/bot-icon.png" alt="avatar-bot" />
      <div className="chat-bubble">
        <div className="typing">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};
