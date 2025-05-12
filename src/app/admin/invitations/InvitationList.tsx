'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export default function InvitationList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<{
    id: string | null;
    loading: boolean;
    error?: string;
    success?: string;
  }>({ id: null, loading: false });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invitations');
      }

      setInvitations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendInvitation = async (id: string) => {
    setResendStatus({ id, loading: true });
    
    try {
      const response = await fetch(`/api/admin/invitations/${id}/resend`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }
      
      // Show success message
      setResendStatus({ 
        id, 
        loading: false, 
        success: 'Invitation resent!' 
      });
      
      // Refresh the invitations list
      fetchInvitations();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setResendStatus(prev => ({ ...prev, success: undefined, id: null }));
      }, 3000);
      
    } catch (err) {
      setResendStatus({ 
        id, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Failed to resend invitation'
      });
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setResendStatus(prev => ({ ...prev, error: undefined, id: null }));
      }, 3000);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
        {error}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No invitations found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expires
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invitations.map((invitation) => (
            <tr key={invitation.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {invitation.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invitation.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invitation.company || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invitation.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : invitation.status === 'ACCEPTED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {invitation.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {invitation.status !== 'ACCEPTED' && (
                  <div className="flex items-center">
                    <button
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={resendStatus.loading && resendStatus.id === invitation.id}
                      className="text-indigo-600 hover:text-indigo-900 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendStatus.loading && resendStatus.id === invitation.id 
                        ? 'Sending...' 
                        : 'Resend'}
                    </button>
                    
                    {resendStatus.id === invitation.id && resendStatus.error && (
                      <span className="text-red-500 text-xs">{resendStatus.error}</span>
                    )}
                    
                    {resendStatus.id === invitation.id && resendStatus.success && (
                      <span className="text-green-500 text-xs">{resendStatus.success}</span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 