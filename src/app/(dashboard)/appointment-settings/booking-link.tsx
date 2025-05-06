"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface BookingLinkProps {
  initialBookingLink: string | null;
  userId: string;
  baseUrl: string;
}

const BookingLink = ({ initialBookingLink, userId, baseUrl }: BookingLinkProps) => {
  const [copied, setCopied] = useState(false);
  const fullUrl = initialBookingLink ? `${baseUrl}/booking/${initialBookingLink}` : "";

  const handleCopy = async () => {
    if (fullUrl) {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={fullUrl || "No booking link available"}
          readOnly
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          disabled={!fullUrl}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Share this link with your customers to allow them to book appointments directly.
      </p>
    </div>
  );
};

export default BookingLink; 