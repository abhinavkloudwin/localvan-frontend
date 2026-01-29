"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Booking, BookingStatus, PaymentStatus } from "@/lib/types";

interface BookingWithVehicle extends Booking {
  vehicle_model?: string;
  vehicle_type?: string;
  vehicle_images?: string[];
}

type FilterTab = "all" | BookingStatus;

export default function BookingsTab() {
  const [bookings, setBookings] = useState<BookingWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.getMyBookings(0, 100);
      setBookings(response.data || response || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
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
    // timeStr is in HH:MM:SS format
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-2 text-green-600 hover:text-green-700 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-green-600 text-white"
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
              ? "You haven't made any bookings yet."
              : `You don't have any ${activeFilter} bookings.`}
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
                      alt={booking.vehicle_model || "Vehicle"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                        />
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
                        {booking.vehicle_model || "Vehicle"}
                      </h3>
                      {booking.vehicle_type && (
                        <p className="text-sm text-gray-600 capitalize">
                          {booking.vehicle_type}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          booking.booking_status
                        )}`}
                      >
                        {booking.booking_status.charAt(0).toUpperCase() +
                          booking.booking_status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-700">
                        {formatDate(booking.booking_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700">
                        {formatTime(booking.booking_time)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="text-gray-700 font-semibold">
                        ₹{booking.payment_amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`text-sm font-medium ${getPaymentStatusColor(
                          booking.payment_status
                        )}`}
                      >
                        Payment: {booking.payment_status.charAt(0).toUpperCase() +
                          booking.payment_status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {booking.booking_status === BookingStatus.PENDING && (
                      <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                        <svg
                          className="w-5 h-5 animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Waiting for driver confirmation
                      </div>
                    )}
                    {booking.booking_status === BookingStatus.CONFIRMED && (
                      <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Booking confirmed - Driver assigned
                      </div>
                    )}
                    {booking.booking_status === BookingStatus.COMPLETED && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                        Add Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
