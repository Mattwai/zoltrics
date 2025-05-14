import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllAppointments from '@/components/appointment/all-appointment';
import { Booking } from '@/types/booking';

// Mock the components used by AllAppointments
jest.mock('@/components/table', () => ({
  DataTable: ({ children, headers }: { children: React.ReactNode, headers: any[] }) => (
    <div data-testid="mock-data-table">
      <div data-testid="mock-headers">{headers.join(',')}</div>
      <div data-testid="mock-content">{children}</div>
    </div>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-table-cell">{children}</div>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-table-row">{children}</div>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => <div>{children}</div>
}));

jest.mock('@/constants/menu', () => ({
  APPOINTMENT_TABLE_HEADER: ['Name', 'Email', 'Date', 'Service', 'Actions']
}));

describe('AllAppointments Component', () => {
  const mockDate = new Date('2023-05-15T10:00:00Z');
  const mockEndDate = new Date('2023-05-15T11:00:00Z');
  
  const mockBookings: Booking[] = [
    {
      id: '1',
      startTime: mockDate,
      endTime: mockEndDate,
      status: 'confirmed',
      createdAt: mockDate,
      updatedAt: mockDate,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        domain: null
      },
      service: {
        name: 'Consultation'
      },
      bookingMetadata: {
        notes: null
      },
      bookingPayment: null
    },
    {
      id: '2',
      startTime: mockDate,
      endTime: mockEndDate,
      status: 'confirmed',
      createdAt: mockDate,
      updatedAt: mockDate,
      customer: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        domain: {
          name: 'Test Domain'
        }
      },
      service: {
        name: 'Therapy Session'
      },
      bookingMetadata: {
        notes: 'Customer requested a follow-up'
      },
      bookingPayment: {
        amount: 100,
        currency: 'USD',
        status: 'paid'
      }
    }
  ];

  it('renders with bookings', () => {
    const { getByTestId, getAllByTestId } = render(
      <AllAppointments bookings={mockBookings} />
    );
    
    expect(getByTestId('mock-data-table')).toBeInTheDocument();
    expect(getByTestId('mock-headers')).toHaveTextContent('Name,Email,Date,Service,Actions');
    
    // Should have two table rows (one for each booking)
    const tableRows = getAllByTestId('mock-table-row');
    expect(tableRows).toHaveLength(2);
  });

  it('renders a message when no bookings are available', () => {
    const { getByText } = render(
      <AllAppointments bookings={undefined as unknown as Booking[]} />
    );
    
    expect(getByText('No Appointments')).toBeInTheDocument();
  });

  it('renders empty bookings array', () => {
    const { getByText } = render(
      <AllAppointments bookings={[]} />
    );
    
    expect(getByText('No appointments found')).toBeInTheDocument();
  });
}); 