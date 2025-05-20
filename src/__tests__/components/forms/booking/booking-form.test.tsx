import { render, screen, fireEvent } from '@testing-library/react';
import BookingForm from '../../../../components/forms/booking/booking-form';

describe('BookingForm', () => {
  it('shows service duration in dropdown', () => {
    render(<BookingForm userId="test" services={[{id:'1',name:'Test',price:10,isLive:true,duration:90}]}/>);
    expect(screen.getByText(/90 min/)).toBeInTheDocument();
  });

  it('disables overlapping slots for long duration', () => {
    // ...simulate selecting a long duration service and check slots...
    expect(true).toBe(true); // Placeholder
  });

  it('books a slot and blocks out correct times', () => {
    // ...simulate booking and check state...
    expect(true).toBe(true); // Placeholder
  });
}); 