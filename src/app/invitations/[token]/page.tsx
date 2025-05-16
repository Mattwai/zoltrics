'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

interface InvitationData {
  email: string;
  name: string | null;
  company: string | null;
}

export default function InvitationPage({ params }: { params: { token: string } }) {
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('password');
  const router = useRouter();

  useEffect(() => {
    async function fetchInvitationData() {
      try {
        const response = await fetch(`/api/invitations/${params.token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify invitation');
        }

        setInvitationData(data);
        // Pre-fill name if available
        if (data.name) {
          setName(data.name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (params.token) {
      fetchInvitationData();
    }
  }, [params.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      // Redirect to sign-in page after 2 seconds
      setTimeout(() => {
        router.push('/auth/sign-in');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Store invitation token in localStorage to retrieve after google auth
    localStorage.setItem('invitationToken', params.token);
    signIn('google', { callbackUrl: `/auth/accept-invite?token=${params.token}` });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Verifying invitation...
            </h2>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Invitation Error
            </h2>
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
            <div className="mt-6">
              <Link href="/auth/sign-in" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-gray-900">
              Account Created Successfully!
            </h2>
            <p className="mt-2 text-gray-600">
              Redirecting you to sign in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Accept Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>
        
        {invitationData && (
          <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
            <p><strong>Email:</strong> {invitationData.email}</p>
            {invitationData.company && <p><strong>Company:</strong> {invitationData.company}</p>}
          </div>
        )}

        <div className="mt-6">
          <div className="flex bg-gray-50 p-1 rounded-lg">
            <button
              onClick={() => setAuthMethod('password')}
              className={`w-full py-2 text-sm font-medium rounded-md ${
                authMethod === 'password'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setAuthMethod('google')}
              className={`w-full py-2 text-sm font-medium rounded-md ${
                authMethod === 'google'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Google Account
            </button>
          </div>
        </div>

        <div className="mt-6">
          {authMethod === 'password' ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Full name"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Create a password"
                />
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          ) : (
            <div>
              <button
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Image src="/images/google.png" alt="Google Logo" width={20} height={20} className="mr-2" />
                Sign up with Google
              </button>
              <p className="mt-3 text-sm text-center text-gray-600">
                We&apos;ll link your invitation to your Google account. If you don&apos;t have a Google account yet, you&apos;ll be prompted to create one.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/auth/sign-in" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
} 