import { APPOINTMENT_TABLE_HEADER } from "@/constants/menu";
import { getMonthName } from "@/lib/utils";
import { DataTable } from "../table";
import { CardDescription } from "../ui/card";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";

type Props = {
  bookings:
    | {
        Customer: {
          Domain: {
            name: string;
          } | null;
        } | null;
        id: string;
        name: string;
        email: string;
        domainId: string | null;
        source?: string;
        date: Date;
        slot: string;
        createdAt: Date;
      }[]
    | undefined;
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
                  "bg-orange/10 text-orange border-transparent"
                )}>
                  {booking.source === "direct_link" ? "Direct Booking" : "Booking Link"}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))
      ) : (
        <CardDescription>No Appointments</CardDescription>
      )}
    </DataTable>
  );
};

export default AllAppointments;
