import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllAppointments from '@/components/appointment/all-appointment';
import { Booking } from '@/types/booking';

// Mock the components used by AllAppointments
jest.mock('@/components/table', () => ({
  DataTable: ({ children, headers }: { children: React.ReactNode, headers: any[] }) => (
    <table data-testid="mock-data-table">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td data-testid="mock-table-cell">{children}</td>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr data-testid="mock-table-row">{children}</tr>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => <span>{children}</span>
}));

jest.mock('@/constants/menu', () => ({
  APPOINTMENT_TABLE_HEADER: ['Name', 'Email', 'Date', 'Service', 'Actions']
}));

// This mock fixes the HTML nesting issue
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span>←</span>,
  ChevronRight: () => <span>→</span>,
  MoreVertical: () => <span>⋮</span>,
  StickyNote: () => <span>📝</span>,
  ArrowDown: () => <span>↓</span>,
  ArrowUp: () => <span>↑</span>,
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
    const { getByText, getAllByTestId } = render(
      <AllAppointments bookings={mockBookings} />
    );
    
    // Check headers are rendered
    expect(getByText('Name')).toBeInTheDocument();
    expect(getByText('Email')).toBeInTheDocument();
    expect(getByText('Date ↑')).toBeInTheDocument();
    expect(getByText('Service')).toBeInTheDocument();
    
    // Should have two table rows (one for each booking)
    const tableRows = getAllByTestId('mock-table-row');
    expect(tableRows).toHaveLength(2);
    
    // Check for specific content
    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('jane@example.com')).toBeInTheDocument();
    expect(getByText('Consultation')).toBeInTheDocument();
    expect(getByText('Therapy Session')).toBeInTheDocument();
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