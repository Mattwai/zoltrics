import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders default button correctly', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const button = getByRole('button');
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).not.toBeDisabled();
  });

  it('renders disabled button when disabled prop is true', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    const button = getByRole('button');
    
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    const { getByRole } = render(
      <Button className="custom-class">Custom Button</Button>
    );
    const button = getByRole('button');
    
    expect(button).toHaveClass('custom-class');
  });

  it('handles onClick events', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Button onClick={handleClick}>Clickable</Button>
    );
    const button = getByRole('button');
    
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with different variants', () => {
    const { getByTestId } = render(
      <div>
        <Button data-testid="default-button">Default</Button>
        <Button data-testid="destructive-button" variant="destructive">Destructive</Button>
        <Button data-testid="outline-button" variant="outline">Outline</Button>
        <Button data-testid="secondary-button" variant="secondary">Secondary</Button>
        <Button data-testid="ghost-button" variant="ghost">Ghost</Button>
        <Button data-testid="link-button" variant="link">Link</Button>
      </div>
    );
    
    expect(getByTestId('default-button')).toBeInTheDocument();
    expect(getByTestId('destructive-button')).toBeInTheDocument();
    expect(getByTestId('outline-button')).toBeInTheDocument();
    expect(getByTestId('secondary-button')).toBeInTheDocument();
    expect(getByTestId('ghost-button')).toBeInTheDocument();
    expect(getByTestId('link-button')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { getByTestId } = render(
      <div>
        <Button data-testid="default-size">Default Size</Button>
        <Button data-testid="sm-size" size="sm">Small</Button>
        <Button data-testid="lg-size" size="lg">Large</Button>
        <Button data-testid="icon-size" size="icon">Icon</Button>
      </div>
    );
    
    expect(getByTestId('default-size')).toBeInTheDocument();
    expect(getByTestId('sm-size')).toBeInTheDocument();
    expect(getByTestId('lg-size')).toBeInTheDocument();
    expect(getByTestId('icon-size')).toBeInTheDocument();
  });
}); 