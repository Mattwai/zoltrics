import prisma from "@/lib/prisma";

export async function onGetUserByBookingLink(bookingLink: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        bookingLink,
      },
    });
    return user;
  } catch (error) {
    console.error("Error getting user by booking link:", error);
    return null;
  }
}
