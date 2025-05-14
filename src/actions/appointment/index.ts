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
        name: true,
        questions: {
          select: {
            id: true,
            question: true,
            answer: true,
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
        customer: {
          domainId: domainId
        }
      },
      select: {
        startTime: true,
        endTime: true,
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
  startTime: string,
  endTime: string,
  email: string,
  name: string
) => {
  try {
    const booking = await client.booking.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        customer: {
          connect: {
            id: customerId
          }
        },
        bookingMetadata: {
          create: {
            notes: "Created via domain portal"
          }
        }
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
  questions: Record<string, string>,
  customerId: string
) => {
  try {
    for (const [questionId, answer] of Object.entries(questions)) {
      await client.customerResponses.update({
        where: {
          id: questionId,
        },
        data: {
          answer: answer,
        },
      });
    }
    return {
      status: 200,
      message: "Updated Responses",
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
        customer: {
          domain: {
            userId: id,
          },
        },
        NOT: {
          userId: id // Exclude direct bookings
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            name: true,
            email: true,
            domain: {
              select: {
                name: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        bookingMetadata: {
          select: {
            notes: true,
          }
        },
        bookingPayment: {
          select: {
            amount: true,
            currency: true,
            status: true,
          }
        },
      },
    });

    // Get direct bookings (those with no domainId or created via booking link)
    const directBookings = await client.booking.findMany({
      where: {
        userId: id,
        customer: {
          is: {
            domainId: undefined
          }
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            name: true,
            email: true,
            domain: {
              select: {
                name: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        bookingMetadata: {
          select: {
            notes: true,
          }
        },
        bookingPayment: {
          select: {
            amount: true,
            currency: true,
            status: true,
          }
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
          customer: {
            domain: {
              userId: session.user.id,
            },
          },
        },
      });
      
      // Count direct bookings
      const directBookings = await client.booking.count({
        where: {
          userId: session.user.id,
          customer: {
            domainId: undefined
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
          bookingLink: {
            link: bookingLink
          }
        }
      },
      include: {
        chatBot: true,
        helpdesk: true,
        domains: {
          include: {
            services: {
              include: {
                pricing: true,
                status: true
              }
            }
          }
        }
      }
    });
    return user;
  } catch (error) {
    console.error("Error getting user by booking link:", error);
    return null;
  }
};

export const getUpcomingAppointments = async (userId: string, limit = 3) => {
  try {
    // Get current date and time
    const now = new Date();
    
    // Fetch upcoming domain bookings
    const domainBookings = await client.booking.findMany({
      where: {
        customer: {
          domain: {
            userId: userId,
          },
        },
        startTime: {
          gte: now,
        },
        NOT: {
          userId: userId // Exclude direct bookings
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        customer: {
          select: {
            name: true,
            email: true,
            domain: {
              select: {
                name: true,
              },
            },
          },
        },
        bookingMetadata: {
          select: {
            notes: true,
          }
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    // Fetch upcoming direct bookings
    const directBookings = await client.booking.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: now,
        },
        customer: {
          is: {
            domainId: undefined
          }
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        bookingMetadata: {
          select: {
            notes: true,
          }
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: limit,
    });

    // Combine and sort all bookings by startTime
    const allUpcomingBookings = [...domainBookings, ...directBookings].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    ).slice(0, limit);

    return allUpcomingBookings;
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    return [];
  }
};
