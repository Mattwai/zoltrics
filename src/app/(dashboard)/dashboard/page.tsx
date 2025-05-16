import { getUserAppointments } from "@/actions/appointment";
import { getUpcomingAppointments } from "@/actions/appointment";
import {
  getUserBalance,
  getUserClients,
  getUserActiveServicesCount,
  getUserPlanInfo,
  getUserTransactions,
} from "@/actions/dashboard";
import DashboardCard from "@/components/dashboard/cards";
import { PlanUsage } from "@/components/dashboard/plan-usage";
import InfoBar from "@/components/infobar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CalIcon from "@/icons/cal-icon";
import PersonIcon from "@/icons/person-icon";
import { TransactionsIcon } from "@/icons/transactions-icon";
import { DollarSign, MessageSquare, Package, Calendar, TrendingUp, Users, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

// Simplified booking type that matches what getUpcomingAppointments returns
interface SimpleBooking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  customer: {
    name: string;
    email: string;
    domain?: {
      name: string;
    } | null;
  } | null;
  bookingMetadata: {
    notes: string | null;
  } | null;
}

type Props = {};

const Page = async (props: Props) => {
  // Wrap data fetching in try/catch to handle errors
  let activeServicesCount = 0;
  let sales = 0;
  let clients = 0;
  let bookings = 0;
  let plan = null;
  let transactions = null;
  let upcomingAppointments: SimpleBooking[] = [];
  let errors = [];

  try {
    activeServicesCount = await getUserActiveServicesCount() || 0;
  } catch (error) {
    console.error("Error fetching active services count:", error);
    errors.push("Failed to load service information");
  }

  try {
    sales = await getUserBalance() || 0;
  } catch (error) {
    console.error("Error fetching balance:", error);
    errors.push("Failed to load revenue information");
  }

  try {
    clients = await getUserClients() || 0;
  } catch (error) {
    console.error("Error fetching clients:", error);
    errors.push("Failed to load client information");
  }

  try {
    bookings = await getUserAppointments() || 0;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    errors.push("Failed to load appointment information");
  }

  try {
    plan = await getUserPlanInfo();
  } catch (error) {
    console.error("Error fetching plan info:", error);
    errors.push("Failed to load subscription information");
  }

  try {
    transactions = await getUserTransactions();
  } catch (error) {
    console.error("Error fetching transactions:", error);
    errors.push("Failed to load transaction information");
  }

  // Fetch upcoming appointments
  try {
    const session = await getServerSession(authConfig);
    if (session?.user?.id) {
      upcomingAppointments = await getUpcomingAppointments(session.user.id, 3) || [];
    }
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    errors.push("Failed to load upcoming appointment details");
  }

  // Calculate next appointment time (example - would typically come from actual appointment data)
  const nextAppointmentTime = bookings > 0 ? "Tomorrow at 2:00 PM" : null;

  // Calculate average service price safely
  const avgServicePrice = activeServicesCount > 0 && sales > 0 
    ? (sales / activeServicesCount).toFixed(2) 
    : "0.00";

  // Calculate usage metrics
  const totalConversations = 0; // Would come from actual chatbot data
  const avgResponseTime = "0.5s"; // Would come from actual chatbot data

  // Format upcoming appointment time
  const formatAppointmentDate = (date: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Check if date is today
    if (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    ) {
      return `Today at ${format(dateObj, 'h:mm a')}`;
    }
    
    // Check if date is tomorrow
    if (
      dateObj.getDate() === tomorrow.getDate() &&
      dateObj.getMonth() === tomorrow.getMonth() &&
      dateObj.getFullYear() === tomorrow.getFullYear()
    ) {
      return `Tomorrow at ${format(dateObj, 'h:mm a')}`;
    }
    
    // Otherwise return full date with time
    return format(dateObj, 'MMM d, yyyy') + ' at ' + format(dateObj, 'h:mm a');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
      <InfoBar />
        
        {/* Error Alerts */}
        {errors.length > 0 && (
          <div className="mb-6 space-y-2">
            {errors.map((error, index) => (
              <Alert variant="destructive" key={index}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            value={clients}
            title="Total Clients"
            icon={<Users className="w-5 h-5" />}
          />
          <DashboardCard
            value={upcomingAppointments.length || bookings}
            title="Appointments"
            subtitle={upcomingAppointments.length > 0 ? "Upcoming bookings" : "Total appointments"}
            icon={<Calendar className="w-5 h-5" />}
          />
          <DashboardCard
            value={sales}
            sales
            title="Total Revenue"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <DashboardCard
            value={activeServicesCount}
            title="Active Services"
            icon={<Package className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">Upcoming Appointments</h2>
                    <p className="text-sm text-gray-500">Your next scheduled meetings</p>
                  </div>
                </div>
                <Link href="/appointment" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{appointment.customer?.name}</p>
                          <p className="text-sm text-gray-500">{formatAppointmentDate(appointment.startTime)}</p>
                        </div>
                      </div>
                      {appointment.customer?.domain?.name && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                          {appointment.customer.domain.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming appointments</p>
                  <Link href="/appointment" className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium inline-block">
                    Schedule Now
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <div className="w-5 h-5 text-green-600">
                      <TransactionsIcon />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">Recent Transactions</h2>
                    <p className="text-sm text-gray-500">Latest payment activities</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {transactions && transactions.data && transactions.data.length > 0 ? (
                <div className="space-y-4">
                  {transactions.data.slice(0, 3).map((transaction) => (
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      key={transaction.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.calculated_statement_descriptor || 'Payment'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.created * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-lg text-gray-900">
                        ${(transaction.amount / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 text-gray-300 mx-auto mb-3">
                    <TransactionsIcon />
                  </div>
                  <p className="text-gray-600">No recent transactions</p>
                </div>
              )}
            </div>
          </div>

          {/* Chatbot Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">Chatbot Overview</h2>
                    <p className="text-sm text-gray-500">AI assistant performance</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Details
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold mt-1">{totalConversations}</p>
                  <p className="text-xs text-gray-500 mt-1">+0% from last week</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Avg. Response Time</p>
                  <p className="text-2xl font-bold mt-1">{avgResponseTime}</p>
                  <p className="text-xs text-gray-500 mt-1">-0% from last week</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-lg text-gray-900">Service Performance</h2>
            <p className="text-sm text-gray-500">Your service metrics</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold mt-1">{activeServicesCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Service Price</p>
                <p className="text-2xl font-bold mt-1">
                  ${avgServicePrice}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per service</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue/Service Ratio</p>
                <p className="text-2xl font-bold mt-1">
                  {activeServicesCount > 0 ? (sales / (activeServicesCount || 1)).toFixed(1) : "0.0"}x
                </p>
                <p className="text-xs text-gray-500 mt-1">Multiplier</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
