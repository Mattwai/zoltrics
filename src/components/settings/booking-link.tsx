import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const generateBookingLink = () => {
  return Math.random().toString(36).substring(2, 15);
};

const BookingLink = async () => {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/auth/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bookingLink: true },
  });

  const handleGenerateLink = async () => {
    "use server";
    const newLink = generateBookingLink();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { bookingLink: newLink },
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Booking Link</h2>
      <p className="text-sm text-muted-foreground">
        Share this link with your customers to allow them to book appointments directly.
      </p>
      <div className="flex gap-2">
        <Input
          value={
            user?.bookingLink
              ? `${process.env.NEXT_PUBLIC_APP_URL}/booking/${user.bookingLink}`
              : "No booking link generated yet"
          }
          readOnly
        />
        <form action={handleGenerateLink}>
          <Button type="submit">
            {user?.bookingLink ? "Regenerate" : "Generate"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingLink; 