"use client";

import { APPOINTMENT_TABLE_HEADER } from "@/constants/menu";
import { getMonthName } from "@/lib/utils";
import { DataTable } from "../table";
import { CardDescription } from "../ui/card";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { Booking } from "@/types/booking";
import { format } from "date-fns";

interface Props {
  bookings: Booking[];
  onDelete?: (bookingId: string) => Promise<void>;
  isDeleting?: string | null;
}

const ITEMS_PER_PAGE = 10;

const AllAppointments = ({ bookings, onDelete, isDeleting }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!bookings) {
    return <CardDescription>No Appointments</CardDescription>;
  }

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBookings = bookings.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <DataTable headers={APPOINTMENT_TABLE_HEADER}>
        {currentBookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.name}</TableCell>
            <TableCell>{booking.email}</TableCell>
            <TableCell>
              <div>
                {getMonthName(booking.date.getMonth())} {booking.date.getDate()}{" "}
                {booking.date.getFullYear()}
              </div>
              <div className="uppercase">{booking.slot}</div>
            </TableCell>
            <TableCell>
              <div>
                {getMonthName(booking.createdAt.getMonth())}{" "}
                {booking.createdAt.getDate()} {booking.createdAt.getFullYear()}
              </div>
              <div>
                {String(booking.createdAt.getHours()).padStart(2, '0')}:
                {String(booking.createdAt.getMinutes()).padStart(2, '0')}{" "}
                {booking.createdAt.getHours() > 12 ? "PM" : "AM"}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {booking.Customer?.Domain?.name ? (
                booking.Customer.Domain.name
              ) : (
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  "bg-purple/10 text-purple border-transparent"
                )}>
                  {booking.bookingMetadata?.source === "direct_link" ? "Direct Booking" : "Booking Link"}
                </span>
              )}
            </TableCell>
            <TableCell>{booking.bookingPayment?.depositPaid ? "Yes" : "No"}</TableCell>
            {onDelete && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(booking.id)}
                  disabled={isDeleting === booking.id}
                >
                  {isDeleting === booking.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Delete
                    </>
                  )}
                </Button>
              </TableCell>
            )}
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
