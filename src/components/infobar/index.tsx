import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import BreadCrumb from "./bread-crumb";

type Props = {};

const InfoBar = (props: Props) => {
  return (
    <div className="flex w-full justify-between items-center py-1 mb-8 pr-4">
      <BreadCrumb />
      <div className="flex gap-3 items-center">
        <div></div>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default InfoBar;
