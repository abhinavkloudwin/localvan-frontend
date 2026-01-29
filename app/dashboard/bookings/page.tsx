"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User } from "@/lib/types";
import { BookingStatus } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Booking {
  id: string;
  vehicle_id: string;
  user_id: string;
  owner_id: string;
  src_lat: number;
  src_long: number;
  src_location?: string;
  dest_lat: number;
  dest_long: number;
  dest_location?: string;
  distance_km?: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_mobile?: string;
  user_email?: string;
}

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Pending", value: BookingStatus.PENDING },
  { label: "Confirmed", value: BookingStatus.CONFIRMED },
  { label: "Completed", value: BookingStatus.COMPLETED },
  { label: "Cancelled", value: BookingStatus.CANCELLED },
  { label: "Rejected", value: BookingStatus.REJECTED },
];

export default function BookingsManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    const fetchData = async () => {
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

        setCurrentUser(userData);
        await fetchBookings();
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchBookings();
    }
  }, [statusFilter]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter((booking) =>
        booking.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.vehicle_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.booking_status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBookings(filtered);
    }
  }, [searchQuery, bookings]);

  const fetchBookings = async () => {
    try {
      const response = await apiClient.getAllBookings(0, 100, statusFilter || undefined);
      if (response && response.data) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setError("Failed to load bookings");
    }
  };

  const handleDeleteBooking = (booking: Booking) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Booking",
      message: `Are you sure you want to delete this booking? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.deleteBookingAdmin(booking.id);
          setSuccessMessage(`Booking has been deleted successfully`);
          setError("");
          await fetchBookings();
          setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error: any) {
          setError(error.message || "Failed to delete booking");
          setSuccessMessage("");
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await apiClient.updateBookingStatusAdmin(bookingId, newStatus);
      setSuccessMessage(`Booking status updated successfully`);
      setError("");
      await fetchBookings();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to update booking status");
      setSuccessMessage("");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800";
      case "initiated":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            <div className="mb-6 space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <TableSkeleton rows={10} />
          </main>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

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
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Bookings Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Total: {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{successMessage}</p>
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search by booking ID, customer name, phone, email, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value || "all"}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    statusFilter === option.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <svg
                            className="w-16 h-16 text-gray-300 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <p className="text-lg font-medium">
                            {searchQuery ? "No bookings match your search." : "No bookings found"}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {!searchQuery && statusFilter
                              ? `No ${statusFilter} bookings at the moment`
                              : !searchQuery ? "Bookings will appear here" : ""}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {booking.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {booking.user_name ? (
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-gray-900">{booking.user_name}</div>
                              {booking.user_mobile && (
                                <a href={`tel:${booking.user_mobile}`} className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {booking.user_mobile}
                                </a>
                              )}
                              {booking.user_email && (
                                <a href={`mailto:${booking.user_email}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {booking.user_email}
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {booking.src_location || `${booking.src_lat.toFixed(4)}, ${booking.src_long.toFixed(4)}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {booking.dest_location || `${booking.dest_lat.toFixed(4)}, ${booking.dest_long.toFixed(4)}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {booking.distance_km ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                {booking.distance_km.toFixed(1)} km
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(
                              booking.payment_status
                            )}`}
                          >
                            {booking.payment_status.charAt(0).toUpperCase() +
                              booking.payment_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                              booking.booking_status
                            )}`}
                          >
                            {booking.booking_status.charAt(0).toUpperCase() +
                              booking.booking_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {booking.booking_status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                                className="text-green-600 hover:text-green-900 p-2 border border-green-600 rounded hover:bg-green-50 transition-colors"
                                title="Confirm booking"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, "rejected")}
                                className="text-red-600 hover:text-red-900 p-2 border border-red-600 rounded hover:bg-red-50 transition-colors"
                                title="Reject booking"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {booking.booking_status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, "completed")}
                              className="text-blue-600 hover:text-blue-900 p-2 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                              title="Mark as completed"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(booking)}
                            className="text-red-600 hover:text-red-900 p-2 border border-red-600 rounded hover:bg-red-50 transition-colors"
                            title="Delete booking"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, isOpen: false })
                }
              >
                Cancel
              </Button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
