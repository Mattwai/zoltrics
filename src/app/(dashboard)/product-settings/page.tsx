"use client";

import InfoBar from "@/components/infobar";
import ProductTable from "@/components/products";
import { useEffect, useState } from "react";

type Props = {};

const Page = (props: Props) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await response.json();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your products...</p>
        </div>
      </div>
    );
  }

  // Get all products from all domains
  const allProducts = user.domains.flatMap((domain: any) => domain.products);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <InfoBar />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ProductTable 
              id={user.id}
              products={allProducts}
              onProductAdded={fetchUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page; 