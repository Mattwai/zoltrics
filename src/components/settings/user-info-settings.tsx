"use client";

import { currentUser } from "@clerk/nextjs";
import Section from "../section-label";
const UserInfoSettings = async () => {
  const user = await currentUser();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="User Information"
          message={`Email: ${user?.emailAddresses}`}
        />
      </div>
    </div>
  );
};

export default UserInfoSettings;
