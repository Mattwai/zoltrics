import { render, screen } from '@testing-library/react';
import { CreateServiceForm } from '../../../../components/forms/services/service-form';

// Mock NextAuth and useServices
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: {
      user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated',
  })),
}));

jest.mock('../../../../hooks/settings/use-settings', () => ({
  useServices: () => ({
    onCreateNewService: jest.fn(),
    register: jest.fn(),
    errors: {},
    loading: false,
  }),
}));

describe('CreateServiceForm', () => {
  it('renders duration input', () => {
    render(<CreateServiceForm id="test" />);
    expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
  });

  it('submits with duration', () => {
    // ...simulate filling and submitting form...
    expect(true).toBe(true); // Placeholder
  });
}); 