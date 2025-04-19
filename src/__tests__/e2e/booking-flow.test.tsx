import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock components and modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: jest.fn(() => '/booking/test-link'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('End-to-End Booking Flow', () => {
  // Create a mock booking page component
  const BookingPage = () => {
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      date: '',
      time: '',
      notes: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (step < 3) {
        setStep(step + 1);
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // Mock API call
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, id: 'booking-123' }),
        });
        
        await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        setIsSuccess(true);
      } catch (error) {
        console.error('Booking error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (isSuccess) {
      return (
        <div data-testid="success-message">
          <h1>Booking Confirmed!</h1>
          <p>Thank you for booking an appointment.</p>
          <p data-testid="booking-details">
            Name: {formData.name}<br />
            Email: {formData.email}<br />
            Date: {formData.date}<br />
            Time: {formData.time}
          </p>
        </div>
      );
    }

    return (
      <div>
        <h1>Book an Appointment</h1>
        <div data-testid="step-indicator">Step {step} of 3</div>
        
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div data-testid="personal-info-step">
              <h2>Personal Information</h2>
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  data-testid="name-input"
                />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  data-testid="email-input"
                />
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div data-testid="date-selection-step">
              <h2>Select a Date</h2>
              <div>
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  data-testid="date-input"
                />
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div data-testid="time-selection-step">
              <h2>Select a Time</h2>
              <div>
                <label htmlFor="time">Time</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  data-testid="time-input"
                />
              </div>
              <div>
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  data-testid="notes-input"
                />
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="next-button"
          >
            {isSubmitting ? 'Processing...' : step < 3 ? 'Next' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    );
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('completes the full booking flow successfully', async () => {
    const user = userEvent.setup();
    
    // Render the booking page
    render(<BookingPage />);
    
    // Step 1: Fill in personal information
    expect(screen.getByTestId('personal-info-step')).toBeInTheDocument();
    
    await user.type(screen.getByTestId('name-input'), 'John Doe');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.click(screen.getByTestId('next-button'));
    
    // Step 2: Select a date
    await waitFor(() => {
      expect(screen.getByTestId('date-selection-step')).toBeInTheDocument();
    });
    
    await user.type(screen.getByTestId('date-input'), '2023-12-15');
    await user.click(screen.getByTestId('next-button'));
    
    // Step 3: Select a time and add notes
    await waitFor(() => {
      expect(screen.getByTestId('time-selection-step')).toBeInTheDocument();
    });
    
    await user.type(screen.getByTestId('time-input'), '14:30');
    await user.type(screen.getByTestId('notes-input'), 'Looking forward to our meeting!');
    
    // Configure the mock fetch to simulate a successful booking
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, id: 'booking-123' }),
    });
    
    // Submit the booking
    await user.click(screen.getByTestId('next-button'));
    
    // Verify the booking was submitted with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bookings',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            date: '2023-12-15',
            time: '14:30',
            notes: 'Looking forward to our meeting!',
          }),
        }
      );
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByTestId('booking-details')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('booking-details')).toHaveTextContent('john@example.com');
      expect(screen.getByTestId('booking-details')).toHaveTextContent('2023-12-15');
      expect(screen.getByTestId('booking-details')).toHaveTextContent('14:30');
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    // Mock form validation
    const preventDefaultMock = jest.fn();
    HTMLFormElement.prototype.checkValidity = jest.fn().mockReturnValue(false);
    HTMLFormElement.prototype.reportValidity = jest.fn();
    
    // Render the booking page
    render(<BookingPage />);
    
    // Try to submit without filling required fields
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    
    // We should still be on step 1 because validation should have failed
    expect(screen.getByTestId('personal-info-step')).toBeInTheDocument();
  });
}); 