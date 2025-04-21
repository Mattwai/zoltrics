"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

async function updateBookingLink(userId: string) {
  const newLink = Math.random().toString(36).substring(2, 15);
  
  // Make API call to update the booking link
  const response = await fetch("/api/user/booking-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookingLink: newLink, userId }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update booking link");
  }
  
  const data = await response.json();
  return data.bookingLink;
}

interface BookingLinkProps {
  initialBookingLink: string | null;
  userId: string;
  baseUrl: string;
}

const BookingLink = ({ initialBookingLink, userId, baseUrl }: BookingLinkProps) => {
  const [bookingLink, setBookingLink] = useState(initialBookingLink);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateLink = async () => {
    setIsLoading(true);
    
    try {
      const newLink = await updateBookingLink(userId);
      setBookingLink(newLink);
    } catch (error) {
      console.error("Error generating booking link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingLink) {
      handleGenerateLink();
    }
  }, [bookingLink]);
  
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={
            bookingLink
              ? `${baseUrl}/booking/${bookingLink}`
              : "Generating booking link..."
          }
          readOnly
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Share this link with your customers to allow them to book appointments directly.
      </p>
    </div>
  );
};

export default BookingLink; 