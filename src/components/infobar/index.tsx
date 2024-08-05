"use client";
import Image from "next/image";
import BreadCrumb from "./bread-crumb";

const InfoBar = () => {
  const avatarSrc = "@images/avatar/avatar-1";

  return (
    <div className="flex w-full justify-between items-center py-1 mb-8 pr-4">
      <BreadCrumb />
      <div className="flex gap-3 items-center">
        <Image
          src={avatarSrc}
          alt="Avatar"
          className="rounded-full w-12 h-12"
          width={20}
          height={20}
        />
      </div>
    </div>
  );
};

export default InfoBar;
