import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

describe('Card Components', () => {
  it('renders Card component correctly', () => {
    const { getByTestId } = render(
      <Card data-testid="test-card">Card Content</Card>
    );
    
    expect(getByTestId('test-card')).toBeInTheDocument();
    expect(getByTestId('test-card')).toHaveTextContent('Card Content');
  });

  it('applies custom className to Card', () => {
    const { getByTestId } = render(
      <Card data-testid="test-card" className="custom-class">Card Content</Card>
    );
    
    expect(getByTestId('test-card')).toHaveClass('custom-class');
  });

  it('renders CardHeader component correctly', () => {
    const { getByTestId } = render(
      <CardHeader data-testid="test-header">Header Content</CardHeader>
    );
    
    expect(getByTestId('test-header')).toBeInTheDocument();
    expect(getByTestId('test-header')).toHaveTextContent('Header Content');
  });

  it('renders CardTitle component correctly', () => {
    const { getByTestId } = render(
      <CardTitle data-testid="test-title">Card Title</CardTitle>
    );
    
    expect(getByTestId('test-title')).toBeInTheDocument();
    expect(getByTestId('test-title')).toHaveTextContent('Card Title');
  });

  it('renders CardDescription component correctly', () => {
    const { getByTestId } = render(
      <CardDescription data-testid="test-description">Card Description</CardDescription>
    );
    
    expect(getByTestId('test-description')).toBeInTheDocument();
    expect(getByTestId('test-description')).toHaveTextContent('Card Description');
  });

  it('renders CardContent component correctly', () => {
    const { getByTestId } = render(
      <CardContent data-testid="test-content">Content</CardContent>
    );
    
    expect(getByTestId('test-content')).toBeInTheDocument();
    expect(getByTestId('test-content')).toHaveTextContent('Content');
  });

  it('renders CardFooter component correctly', () => {
    const { getByTestId } = render(
      <CardFooter data-testid="test-footer">Footer</CardFooter>
    );
    
    expect(getByTestId('test-footer')).toBeInTheDocument();
    expect(getByTestId('test-footer')).toHaveTextContent('Footer');
  });

  it('renders a complete card with all subcomponents', () => {
    const { getByTestId } = render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle data-testid="card-title">Example Card</CardTitle>
          <CardDescription data-testid="card-description">This is a description</CardDescription>
        </CardHeader>
        <CardContent data-testid="card-content">
          <p>This is the main content of the card.</p>
        </CardContent>
        <CardFooter data-testid="card-footer">
          <p>Footer content</p>
        </CardFooter>
      </Card>
    );
    
    expect(getByTestId('complete-card')).toBeInTheDocument();
    expect(getByTestId('card-title')).toBeInTheDocument();
    expect(getByTestId('card-description')).toBeInTheDocument();
    expect(getByTestId('card-content')).toBeInTheDocument();
    expect(getByTestId('card-footer')).toBeInTheDocument();
  });
}); 