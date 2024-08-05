"use client";

import { useUser } from "@/context/user-context"; // Adjust the path to where your UserContext is defined
import Section from "../section-label";

const UserInfoSettings = () => {
  const { user } = useUser();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section label="User Information" message={`Email: ${user?.email}`} />
      </div>
    </div>
  );
};

export default UserInfoSettings;
