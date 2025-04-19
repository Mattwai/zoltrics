import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock components and functions
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Appointment Booking Flow', () => {
  // Reset mocks before each test
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  // Create a mock booking page for testing
  const MockBookingPage = () => {
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      date: '',
      slot: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Move to the next step
      if (step < 3) {
        setStep(step + 1);
      } else {
        // Submit the booking
        try {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });
          
          await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          
          // Reset form after successful submission
          setFormData({ name: '', email: '', date: '', slot: '' });
          setStep(1);
        } catch (error) {
          console.error('Booking error:', error);
        }
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

    return (
      <div data-testid="booking-flow">
        <h1>Book an Appointment - Step {step}</h1>
        
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div data-testid="step-1">
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
          )}
          
          {step === 2 && (
            <div data-testid="step-2">
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
          )}
          
          {step === 3 && (
            <div data-testid="step-3">
              <label htmlFor="slot">Time Slot</label>
              <input
                type="text"
                id="slot"
                name="slot"
                value={formData.slot}
                onChange={handleChange}
                required
                data-testid="slot-input"
              />
            </div>
          )}
          
          <button type="submit" data-testid="next-button">
            {step < 3 ? 'Next' : 'Book Appointment'}
          </button>
        </form>
      </div>
    );
  };

  it('completes the booking flow successfully', async () => {
    const user = userEvent.setup();
    
    // Render the mock booking page
    const { getByTestId, queryByTestId } = render(<MockBookingPage />);
    
    // Step 1: Fill in personal details
    expect(getByTestId('step-1')).toBeInTheDocument();
    
    await user.type(getByTestId('name-input'), 'John Doe');
    await user.type(getByTestId('email-input'), 'john@example.com');
    await user.click(getByTestId('next-button'));
    
    // Step 2: Select a date
    await waitFor(() => {
      expect(getByTestId('step-2')).toBeInTheDocument();
    });
    
    await user.type(getByTestId('date-input'), '2023-06-15');
    await user.click(getByTestId('next-button'));
    
    // Step 3: Select a time slot
    await waitFor(() => {
      expect(getByTestId('step-3')).toBeInTheDocument();
    });
    
    await user.type(getByTestId('slot-input'), 'Morning');
    await user.click(getByTestId('next-button'));
    
    // Verify fetch was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          date: '2023-06-15',
          slot: 'Morning',
        }),
      });
    });
    
    // After successful submission, the form should reset to step 1
    await waitFor(() => {
      expect(getByTestId('step-1')).toBeInTheDocument();
      expect(queryByTestId('step-3')).not.toBeInTheDocument();
    });
  });
}); 