"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import ReviewForm from "@/components/reviews/ReviewForm";

interface BookingDetails {
  id: string;
  booking_date: string;
  booking_time: string;
  booking_status: string;
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
}

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        console.log("Fetching booking details for review:", bookingId);
        const bookingResponse = await apiClient.getBookingById(bookingId);
        console.log("Booking response:", bookingResponse);

        if (!bookingResponse || !bookingResponse.data) {
          throw new Error("No booking data received");
        }

        const bookingData = bookingResponse.data;

        // Check if booking is completed
        if (bookingData.booking_status !== "completed") {
          setError("Only completed bookings can be reviewed");
          setLoading(false);
          return;
        }

        setBooking(bookingData);

        // Fetch vehicle details
        console.log("Fetching vehicle details for:", bookingData.vehicle_id);
        const vehicleData = await apiClient.getVehicleById(bookingData.vehicle_id);
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
  }, [bookingId, router]);

  const handleSuccess = () => {
    router.push("/my-bookings");
  };

  const handleCancel = () => {
    router.push("/my-bookings");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Booking</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/my-bookings")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  // Null check for TypeScript
  if (!booking || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load booking details. Please try again.</p>
          <button
            onClick={() => router.push("/my-bookings")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </header>

      {/* Review Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{vehicle.vehicle_name || vehicle.model || "Vehicle"}</h3>
              {vehicle.model && <p className="text-sm text-gray-600">Model: {vehicle.model}</p>}
              {vehicle.vehicle_type && <p className="text-sm text-gray-600">{vehicle.vehicle_type}</p>}
              {vehicle.rc_book_number && <p className="text-xs text-gray-500 mt-1">RC: {vehicle.rc_book_number}</p>}
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              Completed
            </span>
          </div>

          <div className="pt-6">
            <ReviewForm
              bookingId={bookingId}
              vehicleModel={vehicle.vehicle_name || vehicle.model || "Vehicle"}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
