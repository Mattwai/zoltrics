import { client } from "@/lib/prisma";
import { User, Domain, Product } from "@prisma/client";
import BookingForm from "@/components/forms/booking/booking-form";
import AiChatBot from "@/components/chatbot";
import { redirect } from "next/navigation";

type Props = {
  params: {
    link: string;
  };
};

type UserWithRelations = User & {
  domains: (Domain & {
    products: Product[];
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
};

type BookingFormProduct = {
  id: string;
  name: string;
  price: number;
  isLive: boolean;
};

const BookingPage = async ({ params }: Props) => {
  const user = await client.user.findUnique({
    where: {
      bookingLink: params.link,
    },
    include: {
      domains: {
        include: {
          products: true
        }
      },
      chatBot: true,
      helpdesk: true
    }
  }) as UserWithRelations | null;

  if (!user) {
    redirect("/");
  }

  // Get all live products from all domains
  const allProducts = user.domains.flatMap(domain => domain.products);
  const products = allProducts
    .filter(product => (product as Product & { isLive: boolean }).isLive)
    .map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      isLive: (product as Product & { isLive: boolean }).isLive
    })) as BookingFormProduct[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Book an Appointment with {user.name || "Us"}
        </h1>
        <BookingForm userId={user.id} products={products} />
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <AiChatBot
          userId={user.id}
          initialChatBot={{
            name: user.name || "BookerBuddy",
            chatBot: user.chatBot,
            helpdesk: user.helpdesk
          }}
        />
      </div>
    </div>
  );
};

export default BookingPage;
