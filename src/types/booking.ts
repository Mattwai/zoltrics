export interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    name: string;
    email: string;
    domain: {
      name: string;
    } | null;
  } | null;
  service: {
    name: string;
  } | null;
  bookingMetadata: {
    notes: string | null;
  } | null;
  bookingPayment: {
    amount: number;
    currency: string;
    status: string;
  } | null;
} 