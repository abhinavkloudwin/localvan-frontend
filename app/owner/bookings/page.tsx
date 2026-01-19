"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/owner/Sidebar";
import { BookingWithDetails, BookingStatus, PaymentStatus } from "@/lib/types";
import toast from "react-hot-toast";

type FilterTab = "all" | BookingStatus;

export default function OwnerBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();
        if (!userData || userData.role !== "owner") {
          router.push("/");
          return;
        }

        setUser(userData);

        // Fetch bookings after user is loaded
        fetchBookings();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      setError("");
      const response = await apiClient.getOwnerBookings(0, 100);
      setBookings(response?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch bookings");
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    if (processingBookingId) return; // Prevent multiple clicks

    try {
      setProcessingBookingId(bookingId);
      await apiClient.acceptBooking(bookingId);
      toast.success("Booking accepted successfully!");
      // Refresh bookings list
      await fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept booking");
      setError(err.message || "Failed to accept booking");
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (processingBookingId) return; // Prevent multiple clicks

    if (!confirm("Are you sure you want to reject this booking? This action cannot be undone.")) {
      return;
    }

    try {
      setProcessingBookingId(bookingId);
      await apiClient.rejectBooking(bookingId);
      toast.success("Booking rejected successfully!");
      // Refresh bookings list
      await fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject booking");
      setError(err.message || "Failed to reject booking");
    } finally {
      setProcessingBookingId(null);
    }
  };

  const filteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.booking_status === activeFilter);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case BookingStatus.CONFIRMED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case BookingStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-200";
      case BookingStatus.CANCELLED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case BookingStatus.REJECTED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.SUCCESS:
        return "text-green-600";
      case PaymentStatus.PENDING:
      case PaymentStatus.INITIATED:
        return "text-yellow-600";
      case PaymentStatus.FAILED:
        return "text-red-600";
      case PaymentStatus.REFUNDED:
        return "text-blue-600";
      default:
        return "text-gray-600";
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

  const getFilterCount = (filter: FilterTab) => {
    if (filter === "all") return bookings.length;
    return bookings.filter((b) => b.booking_status === filter).length;
  };

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
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                  <Menu size={24} />
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) return null;

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
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
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
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Bookings Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage all bookings for your vehicles
            </p>
          </div>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  All ({getFilterCount("all")})
                </button>
                <button
                  onClick={() => setActiveFilter(BookingStatus.PENDING)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === BookingStatus.PENDING
                      ? "bg-yellow-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Pending ({getFilterCount(BookingStatus.PENDING)})
                </button>
                <button
                  onClick={() => setActiveFilter(BookingStatus.CONFIRMED)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === BookingStatus.CONFIRMED
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Confirmed ({getFilterCount(BookingStatus.CONFIRMED)})
                </button>
                <button
                  onClick={() => setActiveFilter(BookingStatus.COMPLETED)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === BookingStatus.COMPLETED
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Completed ({getFilterCount(BookingStatus.COMPLETED)})
                </button>
                <button
                  onClick={() => setActiveFilter(BookingStatus.CANCELLED)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeFilter === BookingStatus.CANCELLED
                      ? "bg-gray-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancelled ({getFilterCount(BookingStatus.CANCELLED)})
                </button>
              </div>

              {/* Bookings List */}
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No bookings found
                  </h3>
                  <p className="text-gray-500">
                    {activeFilter === "all"
                      ? "No bookings have been made for your vehicles yet."
                      : `No ${activeFilter} bookings found.`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Vehicle Image */}
                        <div className="lg:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {booking.vehicle_images && booking.vehicle_images.length > 0 ? (
                            <img
                              src={booking.vehicle_images[0]}
                              alt={booking.vehicle_name || booking.vehicle_model || "Vehicle"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Booking Details */}
                        <div className="flex-1 space-y-3">
                          {/* Header Row */}
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.vehicle_name || booking.vehicle_model || "Vehicle"}
                              </h3>
                              {booking.vehicle_type && (
                                <p className="text-sm text-gray-600 capitalize">
                                  {booking.vehicle_type}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.booking_status)}`}>
                                {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Customer Info */}
                          {booking.user_name && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Customer Details:</p>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-gray-900">{booking.user_name}</span>
                                </div>
                                {booking.user_mobile && (
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-gray-900">{booking.user_mobile}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Date & Time */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-700">{formatDate(booking.booking_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-700">{formatTime(booking.booking_time)}</span>
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="text-gray-700 font-semibold">₹{booking.payment_amount.toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <span className={`text-sm font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                                Payment: {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons for Pending Bookings */}
                          {booking.booking_status === BookingStatus.PENDING && (
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 mt-4">
                              <button
                                onClick={() => handleAcceptBooking(booking.id)}
                                disabled={processingBookingId === booking.id}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingBookingId === booking.id ? (
                                  <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Accept Booking
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectBooking(booking.id)}
                                disabled={processingBookingId === booking.id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingBookingId === booking.id ? (
                                  <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject Booking
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Status Messages for Other Booking States */}
                          {booking.booking_status === BookingStatus.CONFIRMED && (
                            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-4 py-3 rounded-lg mt-4">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Booking confirmed
                            </div>
                          )}
                          {booking.booking_status === BookingStatus.COMPLETED && (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg mt-4">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Trip completed successfully
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
