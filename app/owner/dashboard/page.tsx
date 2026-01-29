"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Car, Users, DollarSign, CalendarDays, Menu } from "lucide-react";
import StatCard from "@/components/charts/StatCard";
import AreaChartComponent from "@/components/charts/AreaChartComponent";
import BarChartComponent from "@/components/charts/BarChartComponent";
import PieChartComponent from "@/components/charts/PieChartComponent";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Sidebar from "@/components/owner/Sidebar";
import { useOwnerKYC } from "@/contexts/OwnerKYCContext";

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [analytics, setAnalytics] = useState({
    total_bookings: 0,
    total_earnings: 0,
    monthly_earnings: 0,
    earnings_by_month: [] as Array<{ month: string; earnings: number }>,
    booking_status_distribution: [] as Array<{ name: string; value: number }>,
    vehicle_performance: [] as Array<{ vehicle: string; bookings: number }>,
  });
  const { kycData, kycStatus } = useOwnerKYC();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();

        // Check if user is an owner
        if (!userData || userData.role !== "owner") {
          router.push("/");
          return;
        }

        setUser(userData);

        // Fetch vehicle and driver counts for stats
        try {
          const vehiclesResponse = await apiClient.getMyVehicles();
          if (vehiclesResponse && vehiclesResponse.data) {
            setVehicleCount(vehiclesResponse.data.length);
          }
        } catch (error) {
          console.error("Failed to fetch vehicles:", error);
        }

        try {
          const driversResponse = await apiClient.getMyDrivers();
          if (driversResponse && driversResponse.data) {
            setDriverCount(driversResponse.data.filter((d: any) => d.is_active).length);
          }
        } catch (error) {
          console.error("Failed to fetch drivers:", error);
        }

        // Fetch owner analytics
        try {
          const analyticsData = await apiClient.getOwnerAnalytics();
          if (analyticsData) {
            setAnalytics(analyticsData);
          }
        } catch (error) {
          console.error("Failed to fetch analytics:", error);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={logout}
          user={user}
          isUserLoading={loading}
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

  const isKycPending = !user.is_owner_sub_user && kycStatus !== 'approved';

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        user={user}
        isUserLoading={loading}
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
                  <p className="text-sm font-medium text-gray-900">{user?.name || "Partner"}</p>
                  <p className="text-xs text-gray-500">Partner</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* KYC Pending Banner */}
          {isKycPending && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">
                    {kycStatus === 'rejected' ? 'KYC Verification Rejected' : 'KYC Verification Pending'}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {kycStatus === 'rejected'
                      ? `Your KYC was rejected. Reason: ${kycData?.rejected_reason || 'Not specified'}. Please update your details in My Profile.`
                      : 'Your KYC is under review. Some features are disabled until verification is complete. You can view and edit your KYC details in My Profile.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Partner Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your fleet and track performance
            </p>
          </div>

        {/* Analytics Section */}
        <div className="mb-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Vehicles"
              value={vehicleCount}
              icon={Car}
              trend={{ value: 12, isPositive: true }}
              gradientFrom="from-blue-500"
              gradientTo="to-cyan-500"
              delay={0}
            />

            <StatCard
              title="Active Drivers"
              value={driverCount}
              icon={Users}
              trend={{ value: 8, isPositive: true }}
              gradientFrom="from-purple-500"
              gradientTo="to-pink-500"
              delay={0.1}
            />

            <StatCard
              title="Total Bookings"
              value={analytics.total_bookings}
              icon={CalendarDays}
              gradientFrom="from-orange-500"
              gradientTo="to-red-500"
              delay={0.2}
            />

            <StatCard
              title="Monthly Earnings"
              value={`₹${analytics.monthly_earnings.toLocaleString('en-IN')}`}
              icon={DollarSign}
              gradientFrom="from-green-500"
              gradientTo="to-emerald-500"
              delay={0.3}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AreaChartComponent
              title="Monthly Earnings Trend"
              data={analytics.earnings_by_month}
              dataKey="earnings"
              xAxisKey="month"
              color="#10b981"
              gradientId="colorEarnings"
            />

            <PieChartComponent
              title="Booking Status Distribution"
              data={analytics.booking_status_distribution}
              colors={['#10b981', '#f59e0b', '#ef4444']}
              dataKey="value"
              nameKey="name"
            />
          </div>

          {analytics.vehicle_performance.length > 0 && (
            <div className="mb-8">
              <BarChartComponent
                title="Vehicle Performance (Bookings)"
                data={analytics.vehicle_performance}
                bars={[
                  { dataKey: 'bookings', name: 'Bookings', color: '#8b5cf6' }
                ]}
                xAxisKey="vehicle"
              />
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
