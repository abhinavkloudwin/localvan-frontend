"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User } from "@/lib/types";
import {
  Users,
  Car,
  TrendingUp,
  FileCheck,
  DollarSign,
  Activity,
  Menu
} from "lucide-react";
import StatCard from "@/components/charts/StatCard";
import AreaChartComponent from "@/components/charts/AreaChartComponent";
import BarChartComponent from "@/components/charts/BarChartComponent";
import PieChartComponent from "@/components/charts/PieChartComponent";
import LineChartComponent from "@/components/charts/LineChartComponent";
import Sidebar from "@/components/admin/Sidebar";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statistics, setStatistics] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    total_drivers: 0,
    active_drivers: 0,
    total_vehicles: 0,
    active_vehicles: 0,
    total_bookings: 0,
    pending_bookings: 0,
    completed_bookings: 0,
    total_revenue: 0,
    pending_kyc: 0,
  });
  const [pendingKYCCount, setPendingKYCCount] = useState(0);

  // State for chart data
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number; bookings: number }>>([]);
  const [userGrowthData, setUserGrowthData] = useState<Array<{ month: string; users: number }>>([]);
  const [bookingStatusData, setBookingStatusData] = useState<Array<{ name: string; value: number }>>([]);
  const [vehicleTypeData, setVehicleTypeData] = useState<Array<{ type: string; [key: string]: number | string }>>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/unauthorized");
          return;
        }

        const userData = await apiClient.getProfile();

        if (!checkAdminRole(userData)) {
          router.push("/unauthorized");
          return;
        }

        setUser(userData);

        // Fetch statistics
        const stats = await apiClient.getStatistics();
        setStatistics({
          total_users: stats.total_users || 0,
          active_users: stats.active_users || 0,
          inactive_users: stats.inactive_users || 0,
          total_drivers: stats.total_drivers || 0,
          active_drivers: stats.active_drivers || 0,
          total_vehicles: stats.total_vehicles || 0,
          active_vehicles: stats.active_vehicles || 0,
          total_bookings: stats.total_bookings || 0,
          pending_bookings: stats.pending_bookings || 0,
          completed_bookings: stats.completed_bookings || 0,
          total_revenue: stats.total_revenue || 0,
          pending_kyc: stats.pending_kyc || 0,
        });

        // Set pending KYC count from statistics
        setPendingKYCCount(stats.pending_kyc || 0);

        // Fetch analytics data
        try {
          const [revenue, userGrowth, bookingStatus, vehicleBookings] = await Promise.all([
            apiClient.getRevenueAnalytics(),
            apiClient.getUserGrowthAnalytics(),
            apiClient.getBookingStatusAnalytics(),
            apiClient.getVehicleBookingsAnalytics(),
          ]);

          setRevenueData(revenue.data || []);
          setUserGrowthData(userGrowth.data || []);
          setBookingStatusData(bookingStatus.data || []);
          setVehicleTypeData(vehicleBookings.data || []);
        } catch (analyticsError) {
          console.error("Failed to fetch analytics data:", analyticsError);
          // Don't fail the whole page if analytics fail - just use empty data
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Dynamically generate bar chart configuration based on vehicle data
  const vehicleBars = useMemo(() => {
    if (vehicleTypeData.length === 0) return [];

    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const firstEntry = vehicleTypeData[0];
    const categories = Object.keys(firstEntry).filter(key => key !== 'type');

    return categories.map((category, index) => ({
      dataKey: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      color: colors[index % colors.length]
    }));
  }, [vehicleTypeData]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
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
                  <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Menu size={24} />
                  </button>
                  <div className="hidden lg:block">
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      {/* Main Content */}
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
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Blur overlay for sub-admins */}
        {user?.is_sub_admin && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-8 max-w-md mx-4 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-4">
                Sub-admins do not have access to the main dashboard. Please use the sidebar to navigate to sections you have permission to access.
              </p>
              <div className="text-sm text-gray-500">
                Contact your administrator if you need additional permissions.
              </div>
            </div>
          </div>
        )}

        <div className={user?.is_sub_admin ? "blur-md pointer-events-none select-none" : ""}>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Welcome back, {user.name}! Monitor your platform performance.
            </p>
          </div>

        {/* Colorful Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div onClick={() => router.push("/dashboard/kyc")} className="cursor-pointer">
            <StatCard
              title="Pending KYC"
              value={pendingKYCCount}
              icon={FileCheck}
              trend={{ value: 12, isPositive: false }}
              gradientFrom="from-orange-500"
              gradientTo="to-amber-500"
              delay={0}
            />
          </div>

          <div onClick={() => router.push("/dashboard/bookings")} className="cursor-pointer">
            <StatCard
              title="Total Bookings"
              value={statistics.total_bookings}
              icon={Activity}
              trend={{ value: 23, isPositive: true }}
              gradientFrom="from-blue-500"
              gradientTo="to-cyan-500"
              delay={0.1}
            />
          </div>

          <div onClick={() => router.push("/dashboard/users")} className="cursor-pointer">
            <StatCard
              title="Active Users"
              value={statistics.active_users}
              icon={Users}
              trend={{ value: 15, isPositive: true }}
              gradientFrom="from-green-500"
              gradientTo="to-emerald-500"
              delay={0.2}
            />
          </div>

          <div onClick={() => router.push("/dashboard/drivers")} className="cursor-pointer">
            <StatCard
              title="Total Drivers"
              value={statistics.total_drivers}
              icon={Car}
              trend={{ value: 8, isPositive: true }}
              gradientFrom="from-purple-500"
              gradientTo="to-pink-500"
              delay={0.3}
            />
          </div>

          <StatCard
            title="Monthly Revenue"
            value={`₹${statistics.total_revenue ? statistics.total_revenue.toLocaleString() : 0}`}
            icon={DollarSign}
            trend={{ value: 26, isPositive: true }}
            gradientFrom="from-yellow-500"
            gradientTo="to-orange-500"
            delay={0.4}
          />

          <div onClick={() => router.push("/dashboard/vehicles")} className="cursor-pointer">
            <StatCard
              title="Total Vehicles"
              value={statistics.total_vehicles}
              icon={Car}
              trend={{ value: 5, isPositive: true }}
              gradientFrom="from-indigo-500"
              gradientTo="to-blue-500"
              delay={0.5}
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AreaChartComponent
            title="Revenue & Bookings Trend"
            data={revenueData}
            dataKey="revenue"
            xAxisKey="month"
            color="#3b82f6"
            gradientId="colorRevenue"
          />

          <LineChartComponent
            title="User Growth"
            data={userGrowthData}
            lines={[
              { dataKey: 'users', name: 'Total Users', color: '#10b981' }
            ]}
            xAxisKey="month"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BarChartComponent
            title="Bookings by Vehicle Category"
            data={vehicleTypeData}
            bars={vehicleBars}
            xAxisKey="type"
          />

          <PieChartComponent
            title="Booking Status Distribution"
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
