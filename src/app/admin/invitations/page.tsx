import { Metadata } from 'next';
import InvitationList from './InvitationList';
import CreateInvitationForm from './CreateInvitationForm';

export const metadata: Metadata = {
  title: 'Manage Invitations - Zoltrics',
  description: 'Create and manage client invitations',
};

export default function InvitationsPage() {
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
            <CreateInvitationForm />
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Recent Invitations
            </h3>
            <InvitationList />
          </div>
        </div>
      </div>
    </div>
  );
} 