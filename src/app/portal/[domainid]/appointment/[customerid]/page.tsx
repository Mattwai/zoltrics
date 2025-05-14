import {
  onDomainCustomerResponses,
  onGetAllDomainBookings,
} from "@/actions/appointment";
import PortalForm from "@/components/forms/portal/portal-form";

// Add export to mark this route as dynamic
export const dynamic = 'force-dynamic';

type Props = { params: { domainid: string; customerid: string } };

const CustomerSignUpForm = async ({ params }: Props) => {
  const questions = await onDomainCustomerResponses(params.customerid);
  const bookings = await onGetAllDomainBookings(params.domainid);

  if (!questions) return null;

  // Transform the bookings data to match the expected format
  const formattedBookings = bookings?.map(booking => ({
    date: booking.startTime, // Use startTime as the date
    slot: `${booking.startTime.getHours()}:${booking.startTime.getMinutes().toString().padStart(2, '0')} - ${booking.endTime.getHours()}:${booking.endTime.getMinutes().toString().padStart(2, '0')}`
  }));

  // Transform questions to match expected format
  const formattedQuestions = questions.questions.map(q => ({
    id: q.id,
    question: q.question,
    answered: q.answer
  }));

  return (
    <PortalForm
      bookings={formattedBookings}
      email={questions.email!}
      domainid={params.domainid}
      customerId={params.customerid}
      questions={formattedQuestions}
      type="Appointment"
      name={questions.name}
    />
  );
};

export default CustomerSignUpForm;
