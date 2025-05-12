"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Section from "@/components/section-label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/loader";

interface BusinessNameProps {
  userId: string;
  initialBusinessName: string | null;
}

export const BusinessName = ({ userId, initialBusinessName }: BusinessNameProps) => {
  const [businessName, setBusinessName] = useState(initialBusinessName || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateBusinessName = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings/business-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          businessName,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Business name updated successfully",
        });
      } else {
        throw new Error("Failed to update business name");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update business name",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Business Name"
          message="Set your business name that will be displayed in the booking form."
        />
      </div>
      <div className="lg:col-span-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Input
              placeholder="Enter your business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdateBusinessName} disabled={loading}>
            <Loader loading={loading}>Save</Loader>
          </Button>
        </div>
      </div>
    </div>
  );
}; 