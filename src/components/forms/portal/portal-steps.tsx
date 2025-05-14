import React, { useState } from "react";
import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";
import BookAppointmentDate from "./booking-date";
import { ServiceCheckout } from "./service-checkout";
import QuestionsForm from "./questions";

type Props = {
  questions: {
    id: string;
    question: string;
    answered: string | null;
  }[];
  type: "Appointment" | "Payment";
  register: UseFormRegister<FieldValues>;
  error: FieldErrors<FieldValues>;
  onNext(): void;
  step: number;
  date: Date | undefined;
  onBooking: React.Dispatch<React.SetStateAction<Date | undefined>>;
  onBack(): void;
  onSlot(slot: string): void;
  slot?: string;
  loading: boolean;
  bookings?:
    | {
        date: Date;
        slot: string;
      }[]
    | undefined;
  services?: {
    id: string;
    name: string;
    price: number;
  }[];
  amount?: number;
  stripeId?: string;
  onAmount: (amount: number) => void;
};

const PortalSteps = ({
  questions,
  type,
  register,
  error,
  onNext,
  step,
  onBooking,
  date,
  onBack,
  onSlot,
  loading,
  slot,
  bookings,
  amount,
  stripeId,
  services,
  onAmount,
}: Props) => {
  const [stepState, setStepState] = useState(step);

  const handleNext = () => {
    setStepState(stepState + 1);
    onNext();
  };

  const handleBack = () => {
    setStepState(stepState - 1);
    onBack();
  };

  if (stepState == 1) {
    return (
      <QuestionsForm
        register={register}
        error={error}
        onNext={handleNext}
        questions={questions}
      />
    );
  }

  if (stepState == 2 && type == "Appointment") {
    return (
      <BookAppointmentDate
        date={date}
        bookings={bookings}
        currentSlot={slot}
        register={register}
        onBack={handleBack}
        onBooking={onBooking}
        onSlot={onSlot}
        loading={loading}
        userId={""}
      />
    );
  }

  if (stepState == 2 && type == "Payment") {
    return (
      <ServiceCheckout
        services={services}
        onBack={handleBack}
        onNext={handleNext}
        amount={amount}
        onAmount={onAmount}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="font-bold text-gray-600 text-4xl">Thank You</h2>
      <p className="text-center">
        Thank you for taking the time to fill in this form. We look forward to
        <br /> speaking to you soon.
      </p>
    </div>
  );
};

export default PortalSteps;
