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

  it('handles link generation correctly', async () => {
    const mockNewLink = 'new-generated-link';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookingLink: mockNewLink }),
    });

    const user = userEvent.setup();
    
    render(
      <BookingLink 
        userId="test-user-id" 
        initialBookingLink={null} 
        baseUrl="https://example.com" 
      />
    );
    
    // Click the generate button
    await user.click(screen.getByRole('button', { name: /Generate/i }));
    
    // Check if fetch was called with the right parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/booking-link',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      })
    );
    
    // Wait for the link to be updated
    await waitFor(() => {
      expect(screen.getByDisplayValue(`https://example.com/booking/${mockNewLink}`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    // Mock console.error to prevent it from displaying in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const user = userEvent.setup();
    
    render(
      <BookingLink 
        userId="test-user-id" 
        initialBookingLink={null} 
        baseUrl="https://example.com" 
      />
    );
    
    // Click the generate button
    await user.click(screen.getByRole('button', { name: /Generate/i }));
    
    // Wait for the error handling to complete
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByDisplayValue("No booking link generated yet")).toBeInTheDocument();
    });
    
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });
}); 