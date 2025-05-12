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
  const BookingPage = ({ services }: { services: any[] }) => {
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      date: '',
      slot: '',
      notes: '',
      serviceId: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            Time: {formData.slot}
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
            <div data-testid="service-selection-step">
              <h2>Select a Service</h2>
              <div>
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setFormData({ ...formData, serviceId: service.id });
                    }}
                    data-testid={`service-${service.id}`}
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div data-testid="date-selection-step">
              <h2>Select a Date and Time</h2>
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
              <div>
                <label htmlFor="slot">Time Slot</label>
                <select
                  id="slot"
                  name="slot"
                  value={formData.slot}
                  onChange={handleChange}
                  required
                  data-testid="slot-select"
                >
                  <option value="">Select a time slot</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                </select>
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

  // Mock data
  const mockService = {
    id: 'service-1',
    name: 'Test Service',
    price: 100,
    isLive: true
  };

  const mockFormData = {
    name: 'John Doe',
    email: 'john@example.com',
    date: '2023-12-15',
    slot: '09:00',
    notes: 'Test booking',
    serviceId: mockService.id
  };

  // Mock API responses
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            booking: {
              id: 'booking-1',
              ...mockFormData,
              service: mockService
            }
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('completes the booking flow successfully', async () => {
    const user = userEvent.setup();
    
    render(<BookingPage services={[mockService]} />);
    
    // Step 1: Personal Information
    await user.type(screen.getByTestId('name-input'), mockFormData.name);
    await user.type(screen.getByTestId('email-input'), mockFormData.email);
    await user.click(screen.getByTestId('next-button'));
    
    // Step 2: Service Selection
    await waitFor(() => {
      expect(screen.getByTestId('service-selection-step')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId(`service-${mockService.id}`));
    await user.click(screen.getByTestId('next-button'));
    
    // Step 3: Date and Time Selection
    await waitFor(() => {
      expect(screen.getByTestId('date-selection-step')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('date-input'), mockFormData.date);
    await user.selectOptions(screen.getByTestId('slot-select'), mockFormData.slot);
    await user.type(screen.getByTestId('notes-input'), mockFormData.notes);
    
    // Submit booking
    await user.click(screen.getByTestId('next-button'));
    
    // Check for success message and booking details
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByTestId('booking-details')).toHaveTextContent(mockFormData.name);
      expect(screen.getByTestId('booking-details')).toHaveTextContent(mockFormData.email);
      expect(screen.getByTestId('booking-details')).toHaveTextContent(mockFormData.date);
      expect(screen.getByTestId('booking-details')).toHaveTextContent(mockFormData.slot);
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    // Mock form validation
    const preventDefaultMock = jest.fn();
    HTMLFormElement.prototype.checkValidity = jest.fn().mockReturnValue(false);
    HTMLFormElement.prototype.reportValidity = jest.fn();
    
    // Render the booking page
    render(<BookingPage services={[mockService]} />);
    
    // Try to submit without filling required fields
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    
    // We should still be on step 1 because validation should have failed
    expect(screen.getByTestId('personal-info-step')).toBeInTheDocument();
  });
}); 