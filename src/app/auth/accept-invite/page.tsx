'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Create a separate component to use searchParams
function AcceptInviteContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Wrap the function in useCallback
  const associateInvitation = useCallback(async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/invitations/${token}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to associate invitation with your account');
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    // Wait for auth to complete
    if (status === 'loading') return;
    
    // Verify that we have a token and user is logged in
    if (!token) {
      setError('Missing invitation token');
      setIsLoading(false);
      return;
    }
    
    if (!session || !session.user || !session.user.id || !session.user.email) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    // Now TypeScript knows these values are defined
    associateInvitation(session.user.id, session.user.email);
  }, [token, session, status, router, associateInvitation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Finalizing your account...
            </h2>
            <p className="mt-2 text-gray-600">
              Please wait while we associate your Google account with the invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              Error Processing Invitation
            </h2>
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-indigo-600 hover:text-indigo-500"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Setup Complete!
          </h2>
          <p className="mt-2 text-gray-600">
            Your Google account has been successfully associated with the invitation.
          </p>
          <p className="mt-2 text-gray-600">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap the content in Suspense to handle useSearchParams
export default function AcceptInviteAfterGoogleAuth() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
} 