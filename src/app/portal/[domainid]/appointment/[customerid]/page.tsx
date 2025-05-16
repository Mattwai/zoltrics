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
  const formattedBookings = bookings?.map(booking => {
    // Ensure we have proper Date objects
    const startDateTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
    const endDateTime = booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime);
    
    return {
      date: startDateTime, // Use startTime as the date
      slot: `${startDateTime.getHours()}:${startDateTime.getMinutes().toString().padStart(2, '0')} - ${endDateTime.getHours()}:${endDateTime.getMinutes().toString().padStart(2, '0')}`
    };
  });

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
