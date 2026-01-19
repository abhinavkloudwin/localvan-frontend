"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface BookingDetails {
  id: string;
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
  vehicle_id: string;
  created_at: string;
}

interface VehicleDetails {
  id: string;
  model?: string;
  vehicle_name?: string;
  vehicle_type?: string;
  rc_book_number?: string;
  fuel_type?: string;
  driving_mode?: string;
  features?: string;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        console.log("Fetching booking details for:", bookingId);
        const bookingResponse = await apiClient.getBookingById(bookingId);
        console.log("Booking response:", bookingResponse);

        if (!bookingResponse || !bookingResponse.data) {
          throw new Error("No booking data received");
        }

        setBooking(bookingResponse.data);

        // Fetch vehicle details
        console.log("Fetching vehicle details for:", bookingResponse.data.vehicle_id);
        const vehicleData = await apiClient.getVehicleById(bookingResponse.data.vehicle_id);
        console.log("Vehicle data:", vehicleData);

        if (!vehicleData) {
          throw new Error("No vehicle data received");
        }

        setVehicle(vehicleData);
      } catch (error: any) {
        console.error("Failed to fetch booking details:", error);
        setError(error.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Booking</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/my-bookings")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              My Bookings
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Null check for TypeScript
  if (!booking || !vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600">Booking details not found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your booking has been successfully confirmed</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Booking ID Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
            <p className="text-sm opacity-90 mb-1">Booking ID</p>
            <p className="text-2xl font-bold font-mono">{booking.id.substring(0, 8).toUpperCase()}</p>
          </div>

          {/* Travel Details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Travel Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Pickup Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.src_location || `${booking.src_lat.toFixed(4)}, ${booking.src_long.toFixed(4)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Drop Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.dest_location || `${booking.dest_lat.toFixed(4)}, ${booking.dest_long.toFixed(4)}`}
                  </p>
                </div>
              </div>
              {booking.distance_km && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span>Distance: <strong>{booking.distance_km.toFixed(1)} km</strong></span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(booking.booking_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Time</p>
                  <p className="text-sm font-medium text-gray-900">{booking.booking_time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Vehicle Details
            </h2>
            <div className="space-y-3">
              {vehicle.vehicle_name && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vehicle Name</span>
                  <span className="text-sm font-semibold text-gray-900">{vehicle.vehicle_name}</span>
                </div>
              )}
              {vehicle.model && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Model</span>
                  <span className="text-sm font-semibold text-gray-900">{vehicle.model}</span>
                </div>
              )}
              {vehicle.vehicle_type && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm font-semibold text-gray-900">{vehicle.vehicle_type}</span>
                </div>
              )}
              {vehicle.rc_book_number && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">RC Book Number</span>
                  <span className="text-sm font-semibold text-gray-900 font-mono">{vehicle.rc_book_number}</span>
                </div>
              )}
              {vehicle.fuel_type && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fuel Type</span>
                  <span className="text-sm font-semibold text-gray-900">{vehicle.fuel_type}</span>
                </div>
              )}
              {vehicle.driving_mode && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transmission</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{vehicle.driving_mode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Amount Paid</span>
              <span className="text-2xl font-bold text-emerald-600">₹{booking.payment_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Payment Successful
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/my-bookings")}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View My Bookings
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
