"use client";

import { APPOINTMENT_TABLE_HEADER } from "@/constants/menu";
import { getMonthName } from "@/lib/utils";
import { DataTable } from "../table";
import { CardDescription } from "../ui/card";
import { TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, StickyNote } from "lucide-react";
import { useState } from "react";
import { Booking } from "@/types/booking";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { formatTimeSlot } from "@/lib/time-slots";

interface Props {
  bookings: Booking[];
  onBookingOptions?: (bookingId: string) => void;
  isDeleting?: string | null;
}

const ITEMS_PER_PAGE = 10;

const AllAppointments = ({ bookings, onBookingOptions, isDeleting }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!bookings) {
    return <CardDescription>No Appointments</CardDescription>;
  }

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookings = bookings.slice(startIndex, endIndex);
  
  // Format date to ensure correct month display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-4">
      <DataTable headers={APPOINTMENT_TABLE_HEADER}>
        {currentBookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.name}</TableCell>
            <TableCell>{booking.email}</TableCell>
            <TableCell>
              <div className="font-medium">
                {formatDate(booking.date)}
              </div>
              <div className="text-sm text-gray-600">{formatTimeSlot(booking.slot, 60)}</div>
              {booking.notes && (
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <StickyNote className="h-3 w-3" />
                          <span>Has notes</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] whitespace-normal break-words">
                          {booking.notes.length > 100 
                            ? `${booking.notes.substring(0, 100)}...` 
                            : booking.notes}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </TableCell>
            <TableCell>            
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onBookingOptions && onBookingOptions(booking.id)}
                disabled={isDeleting === booking.id}
              >
                {isDeleting === booking.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, bookings.length)} of {bookings.length} appointments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No appointments found
        </div>
      )}
    </div>
  );
};

export default AllAppointments;
