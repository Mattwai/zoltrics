import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  label: string;
  icon: JSX.Element;
  path?: string;
  current?: string;
  onSignOut?(): void;
};

const MenuItem = ({ path, icon, label, current, onSignOut }: Props) => {
  return (
    <Link
      onClick={onSignOut}
      className={cn(
        "flex items-center gap-2 px-1 py-2 rounded-lg my-1",
        !current
          ? "text-gray-500"
          : current == path
          ? "bg-white font-bold text-black"
          : "text-gray-500"
      )}
      href={path ? `/${path}` : "#"}
    >
      {icon} {label}
    </Link>
  );
};

export default MenuItem;
