import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import axios from "axios";
import { differenceInDays, format, parse } from "date-fns";
import path from "path";
import { Options, PythonShell } from "python-shell";
import emailService from "@/lib/email";

// NZ public holidays for 2025 (static list)
const NZ_HOLIDAYS_2025 = [
  "2025-01-01", // New Year's Day
  "2025-01-02", // Day after New Year's
  "2025-02-06", // Waitangi Day
  "2025-04-18", // Good Friday
  "2025-04-21", // Easter Monday
  "2025-04-25", // ANZAC Day
  "2025-06-02", // King's Birthday
  "2025-10-27", // Labour Day
  "2025-12-25", // Christmas Day
  "2025-12-26", // Boxing Day
];

async function fetchWeatherData(date: Date, city: string = "Auckland") {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new Error("Weather API key not configured");
  }
  const dateStr = format(date, "yyyy-MM-dd");
  // Note: OpenWeatherMap free tier has limited forecast data; using current weather as proxy
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const response = await axios.get(url);
  const weather = response.data;
  const temperature = weather.main.temp;
  const isRainy = weather.weather.some(
    (w: any) => w.main.toLowerCase() === "rain"
  )
    ? 1
    : 0;
  return { temperature, isRainy };
}

async function getCustomerBookingHistory(email: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      customer: {
        email: email
      }
    },
    include: {
      bookingMetadata: true
    },
    orderBy: { startTime: "desc" },
  });
  const cancellations = bookings.filter((b) => b.status === "CANCELLED").length;
  const totalBookings = bookings.length;
  const clientReliability =
    totalBookings > 0 ? (totalBookings - cancellations) / totalBookings : 1;
  const isFirstAppointment = totalBookings === 0 ? 1 : 0;
  const daysSinceLastBooking =
    bookings.length > 0 ? differenceInDays(new Date(), bookings[0].startTime) : 365; // Default to 1 year if no prior bookings
  return {
    cancellations,
    clientReliability,
    isFirstAppointment,
    daysSinceLastBooking,
  };
}

function isEvening(slot: string) {
  // Assuming slot is in format "HH:mm" (e.g., "18:30")
  const time = parse(slot, "HH:mm", new Date());
  const hour = time.getHours();
  return hour >= 18 ? 1 : 0; // Evening if 6 PM or later
}

function isPeakTraffic(slot: string) {
  const time = parse(slot, "HH:mm", new Date());
  const hour = time.getHours();
  // Peak traffic: 7-9 AM or 4-6 PM
  return (hour >= 7 && hour < 9) || (hour >= 16 && hour < 18) ? 1 : 0;
}

function isHoliday(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return NZ_HOLIDAYS_2025.includes(dateStr) ? 1 : 0;
}

async function predictCancellationRisk(features: any): Promise<number> {
  const options: Options = {
    mode: "text",
    pythonOptions: ["-u"], // Unbuffered output
    scriptPath: "py",
    pythonPath: ".venv/bin/python3", // Use Python from virtual environment
    args: [JSON.stringify(features)],
  };

  return new Promise((resolve, reject) => {
    const pythonScript = "predict.py";
    const shell = new PythonShell(pythonScript, options);

    let output = "";
    shell.on("message", (message) => {
      output += message;
    });

    shell.end((err) => {
      if (err) return reject(err);

      try {
        const result = JSON.parse(output);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.risk_score);
        }
      } catch (parseErr) {
        reject(new Error(`Failed to parse Python output: ${output}`));
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, date, slot, userId, isAuthenticated, googleUserId, serviceId, notes } = body;

    if (!name || !email || !date || !slot || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate date
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Parse the time slot to get start and end times
    const timeRange = slot.split(" - ");
    let startTimeStr = timeRange[0];
    let endTimeStr = timeRange.length > 1 ? timeRange[1] : null;
    
    console.log(`Time slot: ${slot}, parsed as start: ${startTimeStr}, end: ${endTimeStr}`);
    
    // Make sure we have time in 24-hour format (HH:MM)
    if (startTimeStr.includes('AM') || startTimeStr.includes('PM')) {
      // Convert from 12-hour to 24-hour
      const timeParts = startTimeStr.match(/(\d+):(\d+)\s?(AM|PM)/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const period = timeParts[3].toUpperCase();
        
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        startTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    // Set the correct time on the appointment date
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    // Calculate endTime based on parsed end time or default to 1 hour later
    let endTime;
    if (endTimeStr) {
      if (endTimeStr.includes('AM') || endTimeStr.includes('PM')) {
        // Convert from 12-hour to 24-hour
        const timeParts = endTimeStr.match(/(\d+):(\d+)\s?(AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1]);
          const minutes = parseInt(timeParts[2]);
          const period = timeParts[3].toUpperCase();
          
          if (period === 'PM' && hours < 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          
          endTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
      
      const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
      endTime = new Date(appointmentDate);
      endTime.setHours(endHours, endMinutes, 0, 0);
    } else {
      // Default to 1 hour duration if no end time specified
      endTime = new Date(appointmentDate.getTime() + 60 * 60 * 1000);
    }
    
    console.log(`Appointment will be created from ${appointmentDate.toISOString()} to ${endTime.toISOString()}`);

    // Make sure the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBusinessProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get business name from user's business profile
    const businessName = user.userBusinessProfile?.businessName || undefined;

    // If authenticated with Google, verify the user exists
    if (isAuthenticated && googleUserId) {
      const googleUser = await prisma.user.findUnique({
        where: { id: googleUserId },
      });

      if (!googleUser) {
        return NextResponse.json(
          { error: "Google user not found" },
          { status: 404 }
        );
      }
    }

    // Find or create customer - explicitly set domainId to null for direct bookings
    let customer = await prisma.customer.findFirst({
      where: {
        email: email,
        userId: userId
      }
    });

    if (!customer) {
      // Find the first domain for this user
      const domain = await prisma.domain.findFirst({
        where: { userId }
      });

      if (!domain) {
        throw new Error("No domain found for user");
      }

      customer = await prisma.customer.create({
        data: {
          email,
          name,
          domainId: domain.id,
          userId: userId,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: {
          id: customer.id
        },
        data: {
          name: name
        }
      });
    }

    // Fetch booking history
    const {
      cancellations,
      clientReliability,
      isFirstAppointment,
      daysSinceLastBooking,
    } = await getCustomerBookingHistory(email);

    // Fetch weather data
    const { temperature, isRainy } = await fetchWeatherData(appointmentDate);

    // Calculate other features
    const bookingLeadTime = differenceInDays(appointmentDate, new Date());
    const evening = isEvening(slot);
    const holiday = isHoliday(appointmentDate);
    const peakTraffic = isPeakTraffic(slot);

    // Prepare features for model
    const features = {
      cancellations,
      days_since_last_booking: daysSinceLastBooking,
      is_evening: evening,
      is_rainy: isRainy,
      is_holiday: holiday,
      booking_lead_time: bookingLeadTime,
      client_reliability: clientReliability,
      is_first_appointment: isFirstAppointment,
      temperature,
      is_peak_traffic: peakTraffic,
    };

    // Predict cancellation risk
    const riskScore = await predictCancellationRisk(features);
    const depositRequired = riskScore > 50;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        startTime: appointmentDate,
        endTime: endTime,
        status: "PENDING",
        customerId: customer.id,
        serviceId: serviceId || undefined,
        userId: userId,
        bookingMetadata: {
          create: {
            notes: notes || undefined
          }
        },
        bookingPayment: {
          create: {
            amount: 0,
            currency: "NZD",
            status: "PENDING"
          }
        }
      },
      include: {
        customer: true,
        service: true,
        bookingMetadata: true,
        bookingPayment: true
      }
    });

    // Fetch service name if serviceId was provided
    let serviceName;
    let servicePrice;
    let serviceCurrency = "NZD"; // Default currency
    
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { pricing: true }
      });
      
      if (service) {
        serviceName = service.name;
        if (service.pricing) {
          servicePrice = service.pricing.price;
          serviceCurrency = service.pricing.currency;
        }
      }
    }

    // Format the time for the email to use the same format as display
    const formattedTime = `${format(appointmentDate, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;

    // Send confirmation email
    await emailService.sendBookingConfirmationEmail({
      email,
      name,
      date: appointmentDate.toISOString(),
      time: formattedTime, // Use our properly formatted time instead of the raw slot value
      service: serviceName,
      bookingId: booking.id,
      businessName,
      price: servicePrice,
      currency: serviceCurrency
    });

    return NextResponse.json(
      { success: true, booking, depositRequired, riskScore },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
