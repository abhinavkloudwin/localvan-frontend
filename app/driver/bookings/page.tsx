"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/driver/Sidebar";

interface Booking {
  id: string;
  vehicle_id: string;
  user_id: string;
  owner_id: string;
  booking_date: string;
  booking_time: string;
  src_lat: number;
  src_long: number;
  dest_lat: number;
  dest_long: number;
  payment_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_mobile?: string;
  user_email?: string;
  vehicle_model?: string;
}

export default function DriverBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();
        if (!userData || userData.role !== "driver") {
          router.push("/");
          return;
        }

        setUser(userData);
        await fetchBookings();
      } catch (error) {
        console.error("Failed to check auth:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [statusFilter, user]);

  useEffect(() => {
    let filtered = [...bookings];

    // Apply date range filter
    if (dateRangeFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let startDate = new Date(today);
      let endDate = new Date(today);

      switch (dateRangeFilter) {
        case "today":
          // Only today
          break;
        case "tomorrow":
          startDate.setDate(today.getDate() + 1);
          endDate.setDate(today.getDate() + 1);
          break;
        case "1week":
          endDate.setDate(today.getDate() + 7);
          break;
        case "2weeks":
          endDate.setDate(today.getDate() + 14);
          break;
        case "1month":
          endDate.setMonth(today.getMonth() + 1);
          break;
      }

      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.booking_date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }

    // Apply specific date filter
    if (dateFilter) {
      filtered = filtered.filter((booking) => booking.booking_date === dateFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((booking) =>
        booking.user_name?.toLowerCase().includes(query) ||
        booking.user_mobile?.toLowerCase().includes(query) ||
        booking.user_email?.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query) ||
        booking.booking_status.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, dateFilter, dateRangeFilter, searchQuery]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await apiClient.getDriverBookings(statusFilter || undefined);
      if (response.data) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await apiClient.acceptBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error("Failed to accept booking:", error);
      alert("Failed to accept booking");
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      await apiClient.rejectBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error("Failed to reject booking:", error);
      alert("Failed to reject booking");
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    if (!confirm("Mark this booking as completed?")) return;
    try {
      await apiClient.markBookingCompleted(bookingId);
      fetchBookings();
    } catch (error) {
      console.error("Failed to mark booking as completed:", error);
      alert("Failed to mark booking as completed");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const canCompleteBooking = (bookingDate: string, bookingTime: string): boolean => {
    // Combine booking date and time
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    const now = new Date();

    // Return true if current time is >= booking time
    return now >= bookingDateTime;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
            <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
              <div className="flex items-center justify-between">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                  <Menu size={24} />
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
          <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
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
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              My Bookings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your ride bookings
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            {/* Filter Controls */}
            <div className="mb-4 space-y-3">
              {/* Date Range Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Quick Filters:</span>
                {[
                  { label: "Today", value: "today" },
                  { label: "Tomorrow", value: "tomorrow" },
                  { label: "1 Week", value: "1week" },
                  { label: "2 Weeks", value: "2weeks" },
                  { label: "1 Month", value: "1month" },
                ].map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => {
                      setDateRangeFilter(dateRangeFilter === chip.value ? "" : chip.value);
                      setDateFilter(""); // Clear specific date when using range
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      dateRangeFilter === chip.value
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search by customer, phone, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setDateRangeFilter(""); // Clear range when specific date is selected
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {/* Clear Filters Button */}
                {(searchQuery || dateFilter || dateRangeFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDateFilter("");
                      setDateRangeFilter("");
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Clear All
                  </button>
                )}
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </div>
            </div>

            {loadingBookings ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 animate-pulse">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        booking.booking_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        booking.booking_status === "confirmed" ? "bg-blue-100 text-blue-800" :
                        booking.booking_status === "completed" ? "bg-green-100 text-green-800" :
                        booking.booking_status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                      </span>
                      <p className="text-sm font-bold text-gray-900">₹{booking.payment_amount.toLocaleString("en-IN")}</p>
                    </div>

                    {/* Customer Details */}
                    {booking.user_name && (
                      <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs font-semibold text-gray-900 mb-1">{booking.user_name}</p>
                        {booking.user_mobile && (
                          <a href={`tel:${booking.user_mobile}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {booking.user_mobile}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Date & Time */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(booking.booking_time)}
                      </span>
                    </div>

                    {/* Locations */}
                    <div className="space-y-2 mb-2">
                      <div className="flex items-start gap-2 p-2 bg-green-50 rounded border border-green-200">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="3" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-700">Pickup</p>
                          <p className="text-xs text-gray-700 truncate">{booking.src_lat.toFixed(4)}, {booking.src_long.toFixed(4)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-700">Drop</p>
                          <p className="text-xs text-gray-700 truncate">{booking.dest_lat.toFixed(4)}, {booking.dest_long.toFixed(4)}</p>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${booking.src_lat},${booking.src_long}&destination=${booking.dest_lat},${booking.dest_long}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        Get Directions
                      </a>
                    </div>

                    {/* Action Buttons */}
                    {booking.booking_status === "pending" && (
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleAcceptBooking(booking.id)}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
                    {booking.booking_status === "confirmed" && (
                      <div className="pt-2 border-t border-gray-200">
                        {canCompleteBooking(booking.booking_date, booking.booking_time) ? (
                          <button
                            onClick={() => handleMarkCompleted(booking.id)}
                            className="w-full px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark Complete
                          </button>
                        ) : (
                          <div>
                            <button
                              disabled
                              className="w-full px-3 py-1.5 bg-gray-300 text-gray-500 text-xs font-semibold rounded cursor-not-allowed flex items-center justify-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Locked
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 mb-4">No bookings found</p>
                <p className="text-sm text-gray-400">
                  {statusFilter ? `No ${statusFilter} bookings at the moment` : "Bookings will appear here once customers make reservations"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
