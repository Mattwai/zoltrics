"use client";

import { APPOINTMENT_TABLE_HEADER } from "@/constants/menu";
import { getMonthName } from "@/lib/utils";
import { DataTable } from "../table";
import { CardDescription } from "../ui/card";
import { TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, MoreVertical, StickyNote, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Booking } from "@/types/booking";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { formatTimeSlot, NZ_TIMEZONE } from "@/lib/time-slots";
import { toZonedTime } from 'date-fns-tz';

interface Props {
  bookings: Booking[];
  onBookingOptions?: (bookingId: string) => void;
  isDeleting?: string | null;
}

type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

// Create a custom DataTable that allows header click events
const CustomDataTable = ({ headers, children, onHeaderClick }: {
  headers: string[];
  children: React.ReactNode;
  onHeaderClick?: (index: number) => void;
}) => {
  return (
    <div className="relative rounded-md border">
      <div className="overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-50">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${index === 2 ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={() => index === 2 && onHeaderClick?.(index)}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AllAppointments = ({ bookings, onBookingOptions, isDeleting }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  if (!bookings) {
    return <CardDescription>No Appointments</CardDescription>;
  }

  // Sort bookings by date and time
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);
    return sortDirection === 'asc' 
      ? dateA.getTime() - dateB.getTime() 
      : dateB.getTime() - dateA.getTime();
  });

  const totalPages = Math.ceil(sortedBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookings = sortedBookings.slice(startIndex, endIndex);
  
  // Format date to ensure correct month display in NZT
  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    // Convert to NZ timezone
    const nzDate = toZonedTime(dateObj, NZ_TIMEZONE);
    return format(nzDate, 'MMMM d, yyyy');
  };

  // Format time in NZ timezone
  const formatTime = (date: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    // Convert to NZ timezone
    const nzDate = toZonedTime(dateObj, NZ_TIMEZONE);
    return format(nzDate, 'h:mm a');
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Handler for header click
  const handleHeaderClick = (index: number) => {
    if (index === 2) { // Only respond to Appointment Time header
      toggleSortDirection();
    }
  };

  return (
    <div className="space-y-4">
      <CustomDataTable 
        headers={[
          APPOINTMENT_TABLE_HEADER[0], // Name
          APPOINTMENT_TABLE_HEADER[1], // Email
          `${APPOINTMENT_TABLE_HEADER[2]} ${sortDirection === 'asc' ? '↑' : '↓'}`, // Appointment Time with sort indicator
          APPOINTMENT_TABLE_HEADER[3], // Service
          "", // Empty header for actions column
        ]}
        onHeaderClick={handleHeaderClick}
      >
        {currentBookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.customer?.name || 'N/A'}</TableCell>
            <TableCell>{booking.customer?.email || 'N/A'}</TableCell>
            <TableCell>
              <div className="font-medium">
                {formatDate(booking.startTime)}
              </div>
              <div className="text-sm text-gray-600">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </div>
              {booking.bookingMetadata?.notes && (
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
                          {booking.bookingMetadata.notes.length > 100 
                            ? `${booking.bookingMetadata.notes.substring(0, 100)}...` 
                            : booking.bookingMetadata.notes}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </TableCell>
            <TableCell>
              {booking.service?.name || "No service specified"}
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
      </CustomDataTable>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedBookings.length)} of {sortedBookings.length} appointments
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

      {sortedBookings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No appointments found
        </div>
      )}
    </div>
  );
};

export default AllAppointments;
