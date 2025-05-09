import prisma from "@/lib/prisma";
import axios from "axios";
import { differenceInDays, format, parse } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Options, PythonShell } from "python-shell";

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
    where: { email },
    include: {
      bookingMetadata: true
    },
    orderBy: { date: "desc" },
  });
  const cancellations = bookings.filter((b) => b.bookingMetadata?.no_show).length;
  const totalBookings = bookings.length;
  const clientReliability =
    totalBookings > 0 ? (totalBookings - cancellations) / totalBookings : 1;
  const isFirstAppointment = totalBookings === 0 ? 1 : 0;
  const daysSinceLastBooking =
    bookings.length > 0 ? differenceInDays(new Date(), bookings[0].date) : 365; // Default to 1 year if no prior bookings
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
    const { name, email, date, slot, userId, isAuthenticated, googleUserId, serviceId } = body;

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

    // Make sure the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    const customer = await prisma.customer.upsert({
      where: { email },
      update: {},
      create: {
        email,
        // Setting domainId to null explicitly marks this as a direct booking
        domainId: null,
      },
    });

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
        endTime: new Date(appointmentDate.getTime() + 60 * 60 * 1000), // 1 hour duration
        status: "PENDING",
        customerId: customer.id,
        serviceId: serviceId || null,
        userId: userId,
        metadata: {
          create: {
            noShow: false,
            riskScore,
            isAuthenticated: !!isAuthenticated,
            googleUserId: googleUserId || null,
          }
        },
        payment: {
          create: {
            depositRequired,
            depositPaid: false,
          }
        }
      },
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
