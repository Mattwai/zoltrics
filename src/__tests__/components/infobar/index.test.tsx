import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for the matchers
import InfoBar from '@/components/infobar';

// Mock the BreadCrumb component
jest.mock('@/components/infobar/bread-crumb', () => {
  return function MockBreadCrumb() {
    return <div data-testid="mock-breadcrumb">Breadcrumb Mock</div>;
  };
});

describe('InfoBar Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<InfoBar />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('includes the BreadCrumb component', () => {
    const { getByTestId } = render(<InfoBar />);
    expect(getByTestId('mock-breadcrumb')).toBeInTheDocument();
  });
}); 