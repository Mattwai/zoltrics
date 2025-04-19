"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const generateBookingLink = () => {
  return Math.random().toString(36).substring(2, 15);
};

async function updateBookingLink(userId: string) {
  const newLink = generateBookingLink();
  
  // Make API call to update the booking link
  const response = await fetch("/api/user/booking-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookingLink: newLink }),
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

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Booking Link</h2>
      <p className="text-sm text-muted-foreground">
        Share this link with your customers to allow them to book appointments directly.
      </p>
      <div className="flex gap-2">
        <Input
          value={
            bookingLink
              ? `${baseUrl}/booking/${bookingLink}`
              : "No booking link generated yet"
          }
          readOnly
        />
        <form onSubmit={handleGenerateLink}>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {bookingLink ? "Regenerating..." : "Generating..."}
              </>
            ) : (
              bookingLink ? "Regenerate" : "Generate"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingLink; 