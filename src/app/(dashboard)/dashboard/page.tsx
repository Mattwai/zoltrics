import { getUserAppointments } from "@/actions/appointment";
import {
  getUserBalance,
  getUserClients,
  getUserPlanInfo,
  getUserTotalServicePrices,
  getUserTransactions,
} from "@/actions/dashboard";
import DashboardCard from "@/components/dashboard/cards";
import { PlanUsage } from "@/components/dashboard/plan-usage";
import InfoBar from "@/components/infobar";
import { Separator } from "@/components/ui/separator";
import CalIcon from "@/icons/cal-icon";
import PersonIcon from "@/icons/person-icon";
import { TransactionsIcon } from "@/icons/transactions-icon";
import { DollarSign, MessageSquare, Package, Calendar, TrendingUp, Users, Clock } from "lucide-react";

type Props = {};

const Page = async (props: Props) => {
  const services = await getUserTotalServicePrices();
  const sales = await getUserBalance();
  const clients = await getUserClients();
  const bookings = await getUserAppointments();
  const plan = await getUserPlanInfo();
  const transactions = await getUserTransactions();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
      <InfoBar />
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            value={clients || 0}
            title="Total Clients"
            icon={<Users className="w-5 h-5" />}
          />
          <DashboardCard
            value={bookings || 0}
            title="Appointments"
            icon={<Calendar className="w-5 h-5" />}
          />
          <DashboardCard
            value={sales || 0}
            sales
            title="Total Revenue"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <DashboardCard
            value={services || 0}
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
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {bookings && bookings > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Next Appointment</p>
                        <p className="text-sm text-gray-500">In 2 hours</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                      {bookings} Total
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming appointments</p>
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Schedule Now
                  </button>
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
              {transactions && transactions.data.length > 0 ? (
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
                            {transaction.calculated_statement_descriptor}
                          </p>
                          <p className="text-sm text-gray-500">Today</p>
                        </div>
                      </div>
                      <p className="font-semibold text-lg text-gray-900">
                        ${transaction.amount / 100}
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
                  <p className="text-2xl font-bold mt-1">0</p>
                  <p className="text-xs text-gray-500 mt-1">+0% from last week</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Avg. Response Time</p>
                  <p className="text-2xl font-bold mt-1">0s</p>
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
                <p className="text-2xl font-bold mt-1">{services || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Service Price</p>
                <p className="text-2xl font-bold mt-1">
                  ${services && sales ? (sales / services).toFixed(2) : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
