export interface Booking {
  id: string;
  name: string;
  email: string;
  date: Date;
  slot: string;
  createdAt: Date;
  domainId: string | null;
  notes?: string;
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
} 