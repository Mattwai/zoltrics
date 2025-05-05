"use client";

import InfoBar from "@/components/infobar";
import ProductTable from "@/components/products";
import { useEffect, useState } from "react";

type Props = {};

const Page = (props: Props) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchUser();
  }, []);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  // Get all products from all domains
  const allProducts = user.domains.flatMap((domain: any) => domain.products);

  return (
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0 flex flex-col gap-10 px-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-2xl">Product Settings</h2>
          <p className="text-sm font-light">
            Manage your products and set them live to accept payments from customers.
          </p>
        </div>
        <ProductTable 
          id={user.id}
          products={allProducts}
        />
      </div>
    </>
  );
};

export default Page; 