import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// screen and waitFor are already exported by testing-library/jest-dom
import BookingLink from '@/app/(dashboard)/appointment-settings/booking-link';
import userEvent from '@testing-library/user-event';

// Mock the fetch function
global.fetch = jest.fn();

describe('BookingLink Component', () => {
  beforeEach(() => {
    // Reset the fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
    // Clear all timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up timers
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(
      <BookingLink 
        userId="test-user-id" 
        initialBookingLink={null} 
        baseUrl="https://example.com" 
      />
    );
    
    expect(screen.getByDisplayValue("No booking link available")).toBeInTheDocument();
    expect(screen.getByText("Share this link with your customers to allow them to book appointments directly.")).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows the correct link when initialBookingLink is provided', () => {
    const initialLink = 'test-booking-link';
    render(
      <BookingLink 
        userId="test-user-id" 
        initialBookingLink={initialLink} 
        baseUrl="https://example.com" 
      />
    );
    
    expect(screen.getByDisplayValue(`https://example.com/booking/${initialLink}`)).toBeInTheDocument();
    expect(screen.getByText("Share this link with your customers to allow them to book appointments directly.")).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles copy functionality correctly', async () => {
    const initialLink = 'test-booking-link';
    const user = userEvent.setup({ delay: null });
    
    render(
      <BookingLink 
        userId="test-user-id" 
        initialBookingLink={initialLink} 
        baseUrl="https://example.com" 
      />
    );
    
    // Click the copy button and wait for state updates
    await user.click(screen.getByRole('button'));
    
    // Wait for the copy state to update
    await waitFor(() => {
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
    
    // Fast-forward timers and wait for state updates
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    
    // Wait for the icon to change back
    await waitFor(() => {
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    });
  });

  it('disables copy button when no link is available', () => {
    render(
      <BookingLink 
        userId="test-user-id" 
        initialBookingLink={null} 
        baseUrl="https://example.com" 
      />
    );
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
}); 