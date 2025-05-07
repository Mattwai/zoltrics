"use server";

import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const onDomainCustomerResponses = async (customerId: string) => {
  try {
    const customerQuestions = await client.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        email: true,
        questions: {
          select: {
            id: true,
            question: true,
            answered: true,
          },
        },
      },
    });

    if (customerQuestions) {
      return customerQuestions;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllDomainBookings = async (domainId: string) => {
  try {
    const bookings = await client.booking.findMany({
      where: {
        domainId,
      },
      select: {
        slot: true,
        date: true,
      },
    });

    if (bookings) {
      return bookings;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onBookNewAppointment = async (
  domainId: string,
  customerId: string,
  slot: string,
  date: string,
  email: string,
  name: string
) => {
  try {
    const booking = await client.customer.update({
      where: {
        id: customerId,
      },
      data: {
        booking: {
          create: {
            domainId,
            slot,
            date,
            email,
            name,
            bookingMetadata: {
              create: {
                source: "domain_portal"
              }
            }
          },
        },
      },
    });

    if (booking) {
      return { status: 200, message: "Booking created" };
    }
  } catch (error) {
    console.log(error);
  }
};

export const saveAnswers = async (
  questions: [question: string],
  customerId: string
) => {
  try {
    for (const question in questions) {
      await client.customer.update({
        where: { id: customerId },
        data: {
          questions: {
            update: {
              where: {
                id: question,
              },
              data: {
                answered: questions[question],
              },
            },
          },
        },
      });
    }
    return {
      status: 200,
      messege: "Updated Responses",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllBookingsForCurrentUser = async (id: string) => {
  try {
    // Get bookings related to domains
    const domainBookings = await client.booking.findMany({
      where: {
        Customer: {
          Domain: {
            User: {
              id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slot: true,
        createdAt: true,
        date: true,
        email: true,
        domainId: true,
        bookingMetadata: {
          select: {
            source: true,
            no_show: true,
            riskScore: true
          }
        },
        bookingPayment: {
          select: {
            depositRequired: true,
            depositPaid: true
          }
        },
        Customer: {
          select: {
            Domain: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get direct bookings (those with no domainId or created via booking link)
    const directBookings = await client.booking.findMany({
      where: {
        Customer: {
          booking: {
            some: {
              id: {
                not: undefined,
              },
            },
          },
        },
        domainId: null,
      },
      select: {
        id: true,
        name: true,
        slot: true,
        createdAt: true,
        date: true,
        email: true,
        domainId: true,
        bookingMetadata: {
          select: {
            source: true,
            no_show: true,
            riskScore: true
          }
        },
        bookingPayment: {
          select: {
            depositRequired: true,
            depositPaid: true
          }
        },
        Customer: {
          select: {
            Domain: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Combine both types of bookings
    const allBookings = [...domainBookings, ...directBookings];

    if (allBookings) {
      return {
        bookings: allBookings,
      };
    }
  } catch (error) {
    console.log(error);
  }
};

export const getUserAppointments = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;
  try {
    if (session) {
      // Count domain bookings
      const domainBookings = await client.booking.count({
        where: {
          Customer: {
            Domain: {
              User: {
                id: session.user.id,
              },
            },
          },
        },
      });
      
      // Count direct bookings
      const directBookings = await client.booking.count({
        where: {
          Customer: {
            booking: {
              some: {
                id: {
                  not: undefined,
                },
              },
            },
            domainId: null,
          },
        },
      });

      // Return the combined count
      const totalBookings = domainBookings + directBookings;
      
      if (totalBookings) {
        return totalBookings;
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetUserByBookingLink = async (bookingLink: string) => {
  try {
    const user = await client.user.findFirst({
      where: {
        userBusinessProfile: {
          bookingLink
        }
      },
      include: {
        chatBot: true,
        helpdesk: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error getting user by booking link:", error);
    return null;
  }
};
