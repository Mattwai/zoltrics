import Section from "@/components/section-label";
import { BotIcon } from "@/icons/bot-icon";

import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

type Props = {
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  chatBot: {
    id: string;
    welcomeMessage: string | null;
  } | null;
};

const EditChatbotIcon = ({ register }: Props) => {
  return (
    <div className="py-5 flex flex-col gap-5 items-start">
      <Section
        label="Chatbot icon"
        message="Change the icon for the chatbot."
      />
      <div className="rounded-full cursor-pointer shadow-md w-20 h-20 flex items-center justify-center bg-grandis">
        <BotIcon />
      </div>
    </div>
  );
};

export default EditChatbotIcon;
