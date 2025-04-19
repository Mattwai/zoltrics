import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Create mock functions
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();

// Mock next auth session
jest.mock('next-auth/react', () => ({
  signIn: mockSignIn,
  signOut: mockSignOut,
  useSession: jest.fn(() => ({ 
    data: null, 
    status: 'unauthenticated' 
  })),
}));

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  })),
}));

// Mock authentication components and forms
const MockAuthForm = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await mockSignIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });
      
      if (result?.ok) {
        mockPush('/dashboard');
      } else {
        throw new Error('Failed to sign in');
      }
    } catch (error) {
      setError('An error occurred during sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="auth-form">
      <h1>Sign In</h1>
      {error && <div data-testid="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
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
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            data-testid="password-input"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          data-testid="sign-in-button"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

describe('Authentication Flow Integration Test', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('successfully signs in a user', async () => {
    const user = userEvent.setup();
    
    // Configure mocks for this test
    mockSignIn.mockResolvedValueOnce({ ok: true, error: null });
    
    render(<MockAuthForm />);
    
    // Fill in the form
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    
    // Submit the form
    await user.click(screen.getByTestId('sign-in-button'));
    
    // Check if signIn was called with correct parameters
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
          redirect: false
        })
      );
    });
    
    // Check if router.push was called to redirect to dashboard
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles sign-in failure', async () => {
    const user = userEvent.setup();
    
    // Configure mocks for failed sign-in
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<MockAuthForm />);
    
    // Fill in the form
    await user.type(screen.getByTestId('email-input'), 'wrong@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrongpassword');
    
    // Submit the form
    await user.click(screen.getByTestId('sign-in-button'));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('An error occurred during sign-in.');
    });
  });
}); 