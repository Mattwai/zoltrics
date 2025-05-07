import React from 'react';
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
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, {
      clipboard: mockClipboard,
    });

    const user = userEvent.setup();
    
    render(
      <BookingLink 
        userId="test-user-id" 
        initialBookingLink={initialLink} 
        baseUrl="https://example.com" 
      />
    );
    
    // Click the copy button
    await user.click(screen.getByRole('button'));
    
    // Check if clipboard.writeText was called with the correct URL
    expect(mockClipboard.writeText).toHaveBeenCalledWith(`https://example.com/booking/${initialLink}`);
    
    // Check if the copy icon changes to check icon
    expect(screen.getByRole('button')).toContainElement(screen.getByTestId('check-icon'));
    
    // Fast-forward timers to test the copy state reset
    jest.advanceTimersByTime(2000);
    
    // Check if the icon changes back to copy icon
    expect(screen.getByRole('button')).toContainElement(screen.getByTestId('copy-icon'));
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