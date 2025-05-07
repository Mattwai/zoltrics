import { client } from "@/lib/prisma";
import { User, Domain, Product, ProductPricing, ProductStatus } from "@prisma/client";
import BookingForm from "@/components/forms/booking/booking-form";
import AiChatBot from "@/components/chatbot";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, Building2 } from "lucide-react";

type Props = {
  params: {
    link: string;
  };
};

type ProductWithRelations = Product & {
  pricing: ProductPricing | null;
  status: ProductStatus | null;
};

type UserWithRelations = User & {
  domains: (Domain & {
    products: ProductWithRelations[];
  })[];
  chatBot: {
    id: string;
    welcomeMessage: string | null;
    background: string | null;
    textColor: string | null;
    helpdesk: boolean;
  } | null;
  helpdesk: {
    id: string;
    question: string;
    answer: string;
    domainId: string | null;
  }[];
  userBusinessProfile?: {
    businessName: string;
  };
};

type BookingFormProduct = {
  id: string;
  name: string;
  price: number;
  isLive: boolean;
};

const BookingPage = async ({ params }: Props) => {
  const user = await client.user.findFirst({
    where: {
      userBusinessProfile: {
        bookingLink: params.link
      }
    },
    include: {
      domains: {
        include: {
          products: {
            include: {
              pricing: true,
              status: true
            }
          }
        }
      },
      chatBot: true,
      helpdesk: true,
      userBusinessProfile: true
    }
  }) as UserWithRelations | null;

  if (!user) {
    redirect("/");
  }

  // Get all live products from all domains
  const allProducts = user.domains.flatMap(domain => domain.products);
  const products = allProducts
    .filter(product => product.status?.isLive)
    .map(product => ({
      id: product.id,
      name: product.name,
      price: product.pricing?.price || 0,
      isLive: product.status?.isLive || false
    })) as BookingFormProduct[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {user.userBusinessProfile?.businessName || user.name || "Book an Appointment"}
              </h1>
              <p className="text-lg text-gray-600">
                Schedule your appointment with us today
              </p>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                <span>Online Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>Professional Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <BookingForm userId={user.id} products={products} />
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">Booking Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Flexible Scheduling</h3>
                    <p className="text-sm text-gray-600">Choose a time that works best for you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Instant Confirmation</h3>
                    <p className="text-sm text-gray-600">Get immediate booking confirmation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Professional Service</h3>
                    <p className="text-sm text-gray-600">Expert care and attention to detail</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <AiChatBot
          userId={user.id}
          initialChatBot={{
            name: user.userBusinessProfile?.businessName || user.name || "BookerBuddy",
            chatBot: user.chatBot,
            helpdesk: user.helpdesk
          }}
        />
      </div>
    </div>
  );
};

export default BookingPage;
