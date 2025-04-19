import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const handleChange = jest.fn();
    render(<Input value="initial" onChange={handleChange} />);
    
    const inputElement = screen.getByDisplayValue('initial');
    expect(inputElement).toBeInTheDocument();
    
    // Test value change
    const user = userEvent.setup();
    await user.clear(inputElement);
    await user.type(inputElement, 'new value');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="test-input" />);
    expect(screen.getByTestId('test-input')).toHaveClass('custom-class');
  });

  it('respects disabled state', () => {
    render(<Input disabled data-testid="disabled-input" />);
    expect(screen.getByTestId('disabled-input')).toBeDisabled();
  });

  it('applies readonly attribute', () => {
    render(<Input readOnly data-testid="readonly-input" />);
    expect(screen.getByTestId('readonly-input')).toHaveAttribute('readonly');
  });

  it('handles different input types', () => {
    render(<Input type="password" data-testid="password-input" />);
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
    
    render(<Input type="email" data-testid="email-input" />);
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
    
    render(<Input type="number" data-testid="number-input" />);
    expect(screen.getByTestId('number-input')).toHaveAttribute('type', 'number');
  });

  it('forwards additional props to the input element', () => {
    render(
      <Input 
        maxLength={10} 
        required 
        pattern="[0-9]+" 
        data-testid="props-input" 
      />
    );
    
    const input = screen.getByTestId('props-input');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('pattern', '[0-9]+');
  });
}); 