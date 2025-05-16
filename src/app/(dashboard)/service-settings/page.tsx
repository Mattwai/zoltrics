"use client";

import InfoBar from "@/components/infobar";
import ServiceTable from "@/components/forms/services";
import { useEffect, useState } from "react";

type Props = {};

const Page = (props: Props) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user");
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your services...</p>
        </div>
      </div>
    );
  }

  // Get all services from all domains
  const allServices = user.domains.flatMap((domain: any) => domain.services);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4">
      <InfoBar />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ServiceTable 
          id={user.id}
          services={allServices}
          onServiceAdded={fetchUser}
        />
      </div>
    </div>
    </div>
  );
};

export default Page; 