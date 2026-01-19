"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/types";

interface Booking {
  id: string;
  vehicle_id: string;
  booking_date: string;
  booking_time: string;
  src_lat: number;
  src_long: number;
  src_location?: string;
  dest_lat: number;
  dest_long: number;
  dest_location?: string;
  distance_km?: number;
  payment_amount: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
  vehicle_model?: string;
  vehicle_type?: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewEligibility, setReviewEligibility] = useState<Record<string, { can_review: boolean, reason: string }>>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();
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

  const fetchBookings = async () => {
    try {
      const response = await apiClient.getMyBookings();
      if (response.data) {
        setBookings(response.data);

        // Check review eligibility for completed bookings
        const eligibilityChecks: Record<string, { can_review: boolean, reason: string }> = {};
        for (const booking of response.data) {
          if (booking.booking_status === "completed") {
            try {
              const eligibility = await apiClient.checkReviewEligibility(booking.id);
              eligibilityChecks[booking.id] = eligibility;
            } catch (error) {
              console.error(`Failed to check eligibility for booking ${booking.id}:`, error);
            }
          }
        }
        setReviewEligibility(eligibilityChecks);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  };

  const handleCancelClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
    setAgreedToTerms(false);
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId || !agreedToTerms) return;

    setCancelling(true);
    try {
      await apiClient.cancelBooking(selectedBookingId);
      setShowCancelModal(false);
      setSelectedBookingId(null);
      await fetchBookings();
      alert("Booking cancelled successfully. Refund will be processed as per our policy.");
    } catch (error: any) {
      alert(error.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handleViewReview = async (bookingId: string) => {
    try {
      const review = await apiClient.getReviewByBooking(bookingId);
      setSelectedReview(review);
      setShowReviewModal(true);
    } catch (error: any) {
      alert(error.message || "Failed to load review");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-sm text-gray-600">View and manage your bookings</p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Bookings List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">No bookings found</p>
            <p className="text-gray-400 text-sm mb-6">You haven't made any bookings yet</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Vehicles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{booking.id.substring(0, 13)}...</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.booking_status)}`}>
                      {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                    </span>
                  </div>

                  {/* Travel Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Travel Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="3" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Pickup</p>
                            <p className="text-sm text-gray-900">{booking.src_location || `${booking.src_lat.toFixed(4)}, ${booking.src_long.toFixed(4)}`}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Drop</p>
                            <p className="text-sm text-gray-900">{booking.dest_location || `${booking.dest_lat.toFixed(4)}, ${booking.dest_long.toFixed(4)}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(booking.booking_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {booking.booking_time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Amount</span>
                          <span className="text-lg font-bold text-gray-900">₹{booking.payment_amount.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            booking.payment_status === "success" ? "bg-green-100 text-green-800" :
                            booking.payment_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => router.push(`/booking-confirmation/${booking.id}`)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      View Details
                    </button>
                    {booking.booking_status === "pending" && (
                      <button
                        onClick={() => handleCancelClick(booking.id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        Cancel Booking
                      </button>
                    )}
                    {booking.booking_status === "completed" && (
                      reviewEligibility[booking.id]?.can_review ? (
                        <button
                          onClick={() => router.push(`/review/${booking.id}`)}
                          className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                        >
                          Write Review
                        </button>
                      ) : reviewEligibility[booking.id]?.reason === "Review already submitted" ? (
                        <button
                          onClick={() => handleViewReview(booking.id)}
                          className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
                        >
                          View Review
                        </button>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cancel Booking</h2>

              {/* Terms & Conditions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Cancellation Policy & Refund Terms</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-3 max-h-60 overflow-y-auto">
                  <p className="font-semibold">Please read the following terms carefully:</p>

                  <div>
                    <p className="font-semibold text-gray-900">1. Cancellation Charges:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Cancellation more than 24 hours before booking time: 100% refund</li>
                      <li>Cancellation 12-24 hours before booking time: 50% refund</li>
                      <li>Cancellation less than 12 hours before booking time: No refund</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">2. Refund Process:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Refunds will be processed within 5-7 business days</li>
                      <li>Refund will be credited to the original payment method</li>
                      <li>Processing fees (if any) are non-refundable</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">3. Important Notes:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Once cancelled, the booking cannot be reinstated</li>
                      <li>You will receive a cancellation confirmation email</li>
                      <li>For disputes, please contact our customer support</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to the cancellation policy and refund terms mentioned above
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBookingId(null);
                    setAgreedToTerms(false);
                  }}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!agreedToTerms || cancelling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Review Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Review</h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedReview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-6 h-6 ${star <= selectedReview.rating ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm font-semibold text-gray-900">{selectedReview.rating}/5</span>
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Review</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedReview.review}</p>
                  </div>
                </div>

                {/* Review Date */}
                <div>
                  <p className="text-xs text-gray-500">
                    Submitted on {new Date(selectedReview.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedReview(null);
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
