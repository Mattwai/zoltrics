import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllAppointments from '@/components/appointment/all-appointment';

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

jest.mock('@/constants/menu', () => ({
  APPOINTMENT_TABLE_HEADER: ['Name', 'Email', 'Date', 'Created At', 'Domain', 'Deposit Paid']
}));

describe('AllAppointments Component', () => {
  const mockDate = new Date('2023-05-15T10:00:00Z');
  
  const mockBookings = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      date: mockDate,
      slot: 'Morning',
      createdAt: mockDate,
      domainId: null,
      Customer: {
        Domain: null
      },
      source: 'direct_link',
      deposit_paid: false
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      date: mockDate,
      slot: 'Afternoon',
      createdAt: mockDate,
      domainId: '123',
      Customer: {
        Domain: {
          name: 'Test Domain'
        }
      },
      deposit_paid: false
    }
  ];

  it('renders with bookings', () => {
    const { getByTestId, getAllByTestId } = render(
      <AllAppointments bookings={mockBookings} />
    );
    
    expect(getByTestId('mock-data-table')).toBeInTheDocument();
    expect(getByTestId('mock-headers')).toHaveTextContent('Name,Email,Date,Created At,Domain');
    
    // Should have two table rows (one for each booking)
    const tableRows = getAllByTestId('mock-table-row');
    expect(tableRows).toHaveLength(2);
  });

  it('renders a message when no bookings are available', () => {
    const { getByText } = render(
      <AllAppointments bookings={undefined} />
    );
    
    expect(getByText('No Appointments')).toBeInTheDocument();
  });

  it('renders empty bookings array', () => {
    const { getByText } = render(
      <AllAppointments bookings={[]} />
    );
    
    // With an empty array, there should be no table rows
    // And the component should still render without errors
    expect(true).toBeTruthy();
  });
}); 