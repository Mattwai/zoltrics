"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { useToast } from "@/components/ui/use-toast";

interface BusinessNameSettingsProps {
  userId: string;
  initialBusinessName: string | null;
}

export const BusinessNameSettings = ({ userId, initialBusinessName }: BusinessNameSettingsProps) => {
  const [businessName, setBusinessName] = useState(initialBusinessName || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/business-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          businessName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save business name");
      }

      toast({
        title: "Success",
        description: "Business name updated successfully",
      });
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
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Business Name</h3>
        <p className="text-sm text-muted-foreground">
          This name will be displayed on your booking form and in appointment confirmations.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Enter your business name"
        />
        <Button onClick={handleSave} disabled={loading}>
          <Loader loading={loading}>Save</Loader>
        </Button>
      </div>
    </div>
  );
}; 