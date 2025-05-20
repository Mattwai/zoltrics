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
    id: string;
    name: string;
    duration: number;
    isMultiDay: boolean;
    minDays: number | null;
    maxDays: number | null;
    pricing: {
      price: number;
      currency: string;
    } | null;
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