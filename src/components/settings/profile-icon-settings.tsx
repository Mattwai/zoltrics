"use client";
import { useAvatar } from "@/context/avatar-context";
import Image from "next/image";
import Section from "../section-label";

const ProfileIconSettings = () => {
  const imagePath = "/images/avatar";
  const { avatarSrc, updateAvatar } = useAvatar();

  const handleIconSelection = async (iconName: string) => {
    await updateAvatar(iconName);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section label="Profile Icon" message="Select your Proile Icon" />
      </div>
      <div className="lg:col-span-4 flex lg:flex-row flex-col items-start gap-5">
        {/* Display all available icons from the public folder */}
        {Array.from(Array(10).keys()).map((index) => (
          <button
            key={index}
            onClick={() => handleIconSelection(`avatar-${index + 1}.png`)}
            className={`relative flex justify-center items-center w-16 h-16 rounded-full bg-gray-200 cursor-pointer ${
              avatarSrc === `${imagePath}/avatar-${index + 1}.png`
                ? "ring-4 ring-blue-500"
                : ""
            }`}
          >
            <Image
              src={`${imagePath}/avatar-${index + 1}.png`}
              alt={`Avatar ${index + 1}`}
              className="rounded-full"
              width={64}
              height={64}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileIconSettings;
