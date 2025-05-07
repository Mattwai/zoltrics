import { APPOINTMENT_TABLE_HEADER } from "@/constants/menu";
import { getMonthName } from "@/lib/utils";
import { DataTable } from "../table";
import { CardDescription } from "../ui/card";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";

type Props = {
  bookings: {
    id: string;
    name: string;
    email: string;
    date: Date;
    slot: string;
    createdAt: Date;
    domainId: string | null;
    bookingMetadata: {
      source: string | null;
      no_show: boolean;
      riskScore: number | null;
    } | null;
    bookingPayment: {
      depositRequired: boolean;
      depositPaid: boolean;
    } | null;
    Customer: {
      Domain: {
        name: string;
      } | null;
    } | null;
  }[] | undefined;
};

const AllAppointments = ({ bookings }: Props) => {
  return (
    <DataTable headers={APPOINTMENT_TABLE_HEADER}>
      {bookings ? (
        bookings.map((booking) => (
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
          </TableRow>
        ))
      ) : (
        <CardDescription>No Appointments</CardDescription>
      )}
    </DataTable>
  );
};

export default AllAppointments;
