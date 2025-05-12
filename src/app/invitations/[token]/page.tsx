import { Metadata } from 'next';
import InvitationForm from './InvitationForm';

interface Props {
  params: {
    token: string;
  };
}

export const metadata: Metadata = {
  title: 'Accept Invitation - Zoltrics',
  description: 'Accept your invitation to join Zoltrics',
};

export default function InvitationPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Accept Invitation
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <InvitationForm token={params.token} />
        </div>
      </div>
    </div>
  );
} 