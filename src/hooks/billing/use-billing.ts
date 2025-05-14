import {
  onCreateCustomerPaymentIntentSecret,
  onGetStripeClientSecret,
  onUpdateSubscription,
} from "@/actions/stripe";
import { useToast } from "@/components/ui/use-toast";
import {
  useElements,
  useStripe as useStripeHook,
} from "@stripe/react-stripe-js";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export const useStripe = () => {
  const [onStripeAccountPending, setOnStripeAccountPending] =
    useState<boolean>(false);

  const onStripeConnect = async () => {
    try {
      setOnStripeAccountPending(true);
      const account = await axios.get(`/api/stripe/connect`);
      if (account) {
        setOnStripeAccountPending(false);
        if (account) {
          window.location.href = account.data.url;
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  return { onStripeConnect, onStripeAccountPending };
};

export const useStripeCustomer = (amount: number, stripeId: string) => {
  const [stripeSecret, setStripeSecret] = useState<string>("");
  const [loadForm, setLoadForm] = useState<boolean>(false);

  const onGetCustomerIntent = useCallback(async (amount: number) => {
    try {
      setLoadForm(true);
      const intent = await onCreateCustomerPaymentIntentSecret(
        amount,
        stripeId
      );
      if (intent) {
        setLoadForm(false);
        setStripeSecret(intent.secret!);
      }
    } catch (error) {
      console.log(error);
    }
  }, [stripeId]);

  useEffect(() => {
    onGetCustomerIntent(amount);
  }, [amount, onGetCustomerIntent]);

  return { stripeSecret, loadForm };
};

export const useCompleteCustomerPayment = (onNext: () => void) => {
  const [processing, setProcessing] = useState<boolean>(false);
  const { toast } = useToast();
  const stripe = useStripeHook();
  const elements = useElements();

  const onMakePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return null;
    }

    console.log("no reload");

    try {
      setProcessing(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: "http://localhost:3000/settings",
        },
        redirect: "if_required",
      });

      if (error) {
        console.log(error);
      }

      if (paymentIntent?.status === "succeeded") {
        toast({
          title: "Success",
          description: "Payment complete",
        });
        onNext();
      }

      setProcessing(false);
    } catch (error) {
      console.log(error);
    }
  };

  return { processing, onMakePayment };
};

export const useSubscriptions = (
  plan: "STANDARD" | "PROFESSIONAL" | "BUSINESS"
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [payment, setPayment] = useState<
    "STANDARD" | "PROFESSIONAL" | "BUSINESS"
  >(plan);
  const { toast } = useToast();
  const router = useRouter();
  const onUpdatetToFreTier = async () => {
    try {
      setLoading(true);
      const free = await onUpdateSubscription("STANDARD");
      if (free) {
        setLoading(false);
        toast({
          title: "Success",
          description: free.message,
        });
        router.refresh();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onSetPayment = (payment: "STANDARD" | "PROFESSIONAL" | "BUSINESS") =>
    setPayment(payment);

  return {
    loading,
    onSetPayment,
    payment,
    onUpdatetToFreTier,
  };
};

export const useStripeElements = (
  payment: "STANDARD" | "PROFESSIONAL" | "BUSINESS"
) => {
  const [stripeSecret, setStripeSecret] = useState<string>("");
  const [loadForm, setLoadForm] = useState<boolean>(false);

  const onGetBillingIntent = async (
    plans: "STANDARD" | "PROFESSIONAL" | "BUSINESS"
  ) => {
    try {
      setLoadForm(true);
      const intent = await onGetStripeClientSecret(plans);
      if (intent) {
        setLoadForm(false);
        setStripeSecret(intent.secret!);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    onGetBillingIntent(payment);
  }, [payment]);

  return { stripeSecret, loadForm };
};

export const useCompletePayment = (
  payment: "STANDARD" | "PROFESSIONAL" | "BUSINESS"
) => {
  const [processing, setProcessing] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();
  const stripe = useStripeHook();
  const elements = useElements();

  const onMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return null;
    }

    try {
      setProcessing(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: "http://localhost:3000/settings",
        },
        redirect: "if_required",
      });

      if (error) {
        console.log(error);
      }

      if (paymentIntent?.status === "succeeded") {
        const plan = await onUpdateSubscription(payment);
        if (plan) {
          toast({
            title: "Success",
            description: plan.message,
          });
        }
      }

      setProcessing(false);
      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };

  return { processing, onMakePayment };
};
