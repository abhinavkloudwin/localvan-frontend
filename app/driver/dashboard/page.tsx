"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { CalendarCheck, TrendingUp, DollarSign, Star, Menu } from "lucide-react";
import StatCard from "@/components/charts/StatCard";
import AreaChartComponent from "@/components/charts/AreaChartComponent";
import PieChartComponent from "@/components/charts/PieChartComponent";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Sidebar from "@/components/driver/Sidebar";

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);

  // Mock analytics data - replace with actual API data
  const earningsData = [
    { month: 'Jan', earnings: 8000 },
    { month: 'Feb', earnings: 9500 },
    { month: 'Mar', earnings: 8800 },
    { month: 'Apr', earnings: 11000 },
    { month: 'May', earnings: 10500 },
    { month: 'Jun', earnings: 13000 },
  ];

  const bookingStatusData = [
    { name: 'Completed', value: 68 },
    { name: 'Pending', value: 5 },
    { name: 'Cancelled', value: 3 },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();

        // Check if user is a driver
        if (!userData || userData.role !== "driver") {
          router.push("/");
          return;
        }

        setUser(userData);

        // Fetch booking count for stats
        try {
          const response = await apiClient.getDriverBookings();
          if (response && response.total) {
            setTotalBookings(response.total);
          }
        } catch (error) {
          console.error("Failed to fetch bookings:", error);
        }
      } catch (error) {
        console.error("Failed to check auth:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={logout}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
            <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Menu size={24} />
                  </button>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <DashboardSkeleton />
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
          <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.mobile_number}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Driver Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Track your performance and manage bookings
            </p>
          </div>

          {/* Analytics Section */}
          <div className="mb-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Bookings"
                value={totalBookings}
                icon={CalendarCheck}
                trend={{ value: 15, isPositive: true }}
                gradientFrom="from-emerald-500"
                gradientTo="to-teal-500"
                delay={0}
              />

              <StatCard
                title="Completed Trips"
                value={68}
                icon={TrendingUp}
                trend={{ value: 22, isPositive: true }}
                gradientFrom="from-blue-500"
                gradientTo="to-indigo-500"
                delay={0.1}
              />

              <StatCard
                title="Monthly Earnings"
                value="₹13,000"
                icon={DollarSign}
                trend={{ value: 24, isPositive: true }}
                gradientFrom="from-green-500"
                gradientTo="to-emerald-500"
                delay={0.2}
              />

              <StatCard
                title="Rating"
                value="4.8"
                icon={Star}
                trend={{ value: 3, isPositive: true }}
                gradientFrom="from-yellow-500"
                gradientTo="to-orange-500"
                delay={0.3}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <AreaChartComponent
                title="Earnings Trend"
                data={earningsData}
                dataKey="earnings"
                xAxisKey="month"
                color="#10b981"
                gradientId="colorDriverEarnings"
              />

              <PieChartComponent
                title="Booking Status"
                data={bookingStatusData}
                colors={['#10b981', '#f59e0b', '#ef4444']}
                dataKey="value"
                nameKey="name"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
