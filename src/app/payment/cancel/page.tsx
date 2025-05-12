import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="mb-8 text-4xl font-bold">Payment Cancelled</h1>
        <p className="mb-4 text-lg text-gray-600">
          Your payment was cancelled. No charges have been made.
        </p>
        <p className="mb-8 text-sm text-gray-500">
          If you have any questions or need assistance, please contact our support team.
        </p>
        <div className="space-x-4">
          <Link href="/services">
            <Button>Try Again</Button>
          </Link>
          <Link href="/support">
            <Button variant="outline">Contact Support</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 