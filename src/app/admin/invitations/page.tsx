'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import InvitationList from './InvitationList';
import CreateInvitationForm from './CreateInvitationForm';

export default function InvitationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if user is not authenticated or not an admin
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in');
    } else if (status === 'authenticated') {
      if (session?.user && session.user.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    }
  }, [session, status, router]);

  // Show loading state while checking auth
  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Additional safety check to ensure admin access
  if (session?.user?.role !== 'ADMIN') {
    return null; // Don't render anything if not admin (will be redirected by useEffect)
  }

  const handleInvitationCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Client Invitations</h1>
        </div>

        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Create New Invitation
            </h3>
            <CreateInvitationForm onInvitationCreated={handleInvitationCreated} />
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Recent Invitations
            </h3>
            <InvitationList key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
} 