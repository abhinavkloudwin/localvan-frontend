"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { calculateDistance, calculateBookingAmount } from "@/lib/pricing-utils";

const libraries: ("places")[] = ["places"];

interface Vehicle {
  id: string;
  vehicle_type: string | null;
  vehicle_type_id: string;
  is_ac: boolean;
  model: string | null;
  features: string | null;
  fuel_type: string;
  booking_amount: number | null;
  driving_mode: string;
  vehicle_images: string[] | null;
  registration_date: string;
  rc_book_number: string;
  is_active: boolean;
  vehicle_type_pricing?: {
    model_type: string;
    seats: number;
    base_km: number;
    base_fare_ac: number;
    base_fare_non_ac: number;
    per_km_charge_ac: number;
    per_km_charge_non_ac: number;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const vehicleId = params?.vehicleId as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Form states - Initialize from query params
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingTime, setBookingTime] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLong, setPickupLong] = useState<number | null>(null);
  const [dropLocation, setDropLocation] = useState("");
  const [dropLat, setDropLat] = useState<number | null>(null);
  const [dropLong, setDropLong] = useState<number | null>(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_value: number;
    discount_amount: number;
    final_amount: number;
  } | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Google Places Autocomplete
  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Load search params on mount
  useEffect(() => {
    const pickup = searchParams.get('pickup');
    const pickupLatParam = searchParams.get('pickupLat') || searchParams.get('lat');
    const pickupLongParam = searchParams.get('pickupLong') || searchParams.get('lng');
    const drop = searchParams.get('drop');
    const dropLatParam = searchParams.get('dropLat');
    const dropLongParam = searchParams.get('dropLng');
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');

    if (pickup) setPickupLocation(pickup);
    if (pickupLatParam) setPickupLat(parseFloat(pickupLatParam));
    if (pickupLongParam) setPickupLong(parseFloat(pickupLongParam));
    if (drop) setDropLocation(drop);
    if (dropLatParam) setDropLat(parseFloat(dropLatParam));
    if (dropLongParam) setDropLong(parseFloat(dropLongParam));
    if (dateParam) {
      setBookingDate(new Date(dateParam));
    }
    if (timeParam) setBookingTime(timeParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) {
        setError("Vehicle ID not found");
        setLoading(false);
        return;
      }

      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const response = await apiClient.getVehicleById(vehicleId);
        setVehicle(response);
      } catch (err: any) {
        setError(err.message || "Failed to load vehicle details");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId, router]);

  // Calculate dynamic pricing based on distance
  const bookingAmount = useMemo(() => {
    if (!vehicle || !vehicle.vehicle_type_pricing) {
      return 0;
    }

    // If we have pickup and drop coordinates, calculate dynamic price
    if (pickupLat && pickupLong && dropLat && dropLong) {
      const distance = calculateDistance(pickupLat, pickupLong, dropLat, dropLong);
      const pricing = calculateBookingAmount(
        vehicle.vehicle_type_pricing,
        distance,
        vehicle.is_ac
      );
      return Math.round(pricing.totalAmount);
    }

    // Fallback to old booking_amount if coordinates not available
    return Math.round(vehicle.booking_amount || 0);
  }, [vehicle, pickupLat, pickupLong, dropLat, dropLong]);

  // Google Places Autocomplete handlers
  const onPickupLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setPickupAutocomplete(autocompleteInstance);
  };

  const onDropoffLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setDropoffAutocomplete(autocompleteInstance);
  };

  const onPickupPlaceChanged = () => {
    if (pickupAutocomplete !== null) {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPickupLocation(place.formatted_address || "");
        setPickupLat(lat);
        setPickupLong(lng);
      }
    }
  };

  const onDropoffPlaceChanged = () => {
    if (dropoffAutocomplete !== null) {
      const place = dropoffAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setDropLocation(place.formatted_address || "");
        setDropLat(lat);
        setDropLong(lng);
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (!vehicle) {
      setCouponError("Vehicle details not loaded");
      return;
    }

    setCouponValidating(true);
    setCouponError("");

    try {
      const result = await apiClient.applyCoupon(
        couponCode,
        Number(bookingAmount)
      );

      setAppliedCoupon({
        code: result.coupon_code,
        discount_value: result.discount_value,
        discount_amount: result.discount_amount,
        final_amount: result.final_amount,
      });

      setCouponError("");
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleProceedToPayment = async () => {
    // Validation
    if (!bookingDate) {
      setError("Please select a booking date");
      return;
    }

    if (!bookingTime) {
      setError("Please select a booking time");
      return;
    }

    if (!pickupLocation || !pickupLat || !pickupLong) {
      setError("Please provide pickup location with valid coordinates");
      return;
    }

    if (!dropLocation || !dropLat || !dropLong) {
      setError("Please provide drop location with valid coordinates");
      return;
    }

    if (!vehicle) {
      setError("Vehicle details not loaded");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Format date and time
      const formattedDate = bookingDate.toISOString().split("T")[0];

      // Calculate distance
      const distance = calculateDistance(pickupLat, pickupLong, dropLat, dropLong);

      // Create booking with payment (and optional coupon)
      const { booking, razorpay_order } = await apiClient.createBookingWithPayment({
        vehicle_id: vehicleId,
        booking_date: formattedDate,
        booking_time: bookingTime,
        src_lat: pickupLat,
        src_long: pickupLong,
        src_location: pickupLocation,
        dest_lat: dropLat,
        dest_long: dropLong,
        dest_location: dropLocation,
        distance_km: Math.round(distance * 100) / 100, // Round to 2 decimal places
        payment_amount: Number(bookingAmount) || 0,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
      });

      // Get user details for Razorpay
      const user = await apiClient.getProfile();

      // Open Razorpay checkout
      await openRazorpayCheckout(
        razorpay_order.id,
        razorpay_order.amount,
        async (paymentData: any) => {
          try {
            // Verify payment
            await apiClient.verifyPayment({
              booking_id: booking.id,
              razorpay_order_id: paymentData.razorpay_order_id,
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_signature: paymentData.razorpay_signature,
            });

            // Payment successful, redirect to confirmation page
            router.push(`/booking-confirmation/${booking.id}`);
          } catch (err: any) {
            setError(err.message || "Payment verification failed");
            setProcessing(false);
          }
        },
        () => {
          // Payment cancelled
          setError("Payment was cancelled");
          setProcessing(false);
        },
        {
          name: user.name,
          email: user.email,
          phone: user.mobile_number,
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">Failed to load Google Maps</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top Row - Back button and Title */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors group"
            >
              <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-semibold">Back to Results</span>
            </button>
            <h1 className="text-gray-900 text-xl font-bold">Complete Your Booking</h1>
          </div>

          {/* Search Summary - Modern Card Design */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 shadow-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Pickup */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Pickup Location</label>
                  <Autocomplete
                    onLoad={onPickupLoad}
                    onPlaceChanged={onPickupPlaceChanged}
                    options={{
                      componentRestrictions: { country: "in" }
                    }}
                  >
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Enter pickup location"
                      className="w-full text-sm font-semibold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </Autocomplete>
                </div>
              </div>

              <div className="text-blue-500 font-bold hidden md:block">→</div>

              {/* Drop */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Drop Location</label>
                  <Autocomplete
                    onLoad={onDropoffLoad}
                    onPlaceChanged={onDropoffPlaceChanged}
                    options={{
                      componentRestrictions: { country: "in" }
                    }}
                  >
                    <input
                      type="text"
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      placeholder="Enter drop location"
                      className="w-full text-sm font-semibold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </Autocomplete>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Date</label>
                  <input
                    type="date"
                    value={bookingDate ? bookingDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setBookingDate(e.target.value ? new Date(e.target.value) : null)}
                    className="text-sm font-semibold text-gray-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Time</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="text-sm font-semibold text-gray-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicle Details & Inclusions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Details Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Selected Vehicle
                </h2>
              </div>

              <div className="p-6">
                <div className="flex gap-6">
                  {/* Vehicle Image */}
                  {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="relative group">
                        <img
                          src={vehicle.vehicle_images[0]}
                          alt={vehicle.model || "Vehicle"}
                          className="w-40 h-32 object-cover rounded-2xl shadow-lg border-2 border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"></div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{vehicle.model}</h3>
                    <p className="text-sm text-gray-600 mb-4 font-medium">{vehicle.vehicle_type}</p>

                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-semibold text-blue-900">{vehicle.fuel_type}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span className="text-sm font-semibold text-purple-900 capitalize">{vehicle.driving_mode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Badge */}
                  <div className="text-right">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg">
                      <p className="text-xs text-blue-100 font-medium mb-1">Total Amount</p>
                      <p className="text-3xl font-bold text-white">₹{bookingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inclusions Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What's Included
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Standard Inclusions */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Base Fare Included</p>
                      <p className="text-xs text-gray-600">GST & Taxes included</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Professional Driver</p>
                      <p className="text-xs text-gray-600">Experienced & verified</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Clean & Sanitized</p>
                      <p className="text-xs text-gray-600">Regular sanitization</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">24/7 Support</p>
                      <p className="text-xs text-gray-600">Customer assistance</p>
                    </div>
                  </div>

                  {/* Vehicle Features */}
                  {vehicle.features && vehicle.features.split(", ").slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{feature}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Modern Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl sticky top-32 overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Summary
                </h2>
              </div>

              <div className="p-6 space-y-5">
                {/* Coupon Section */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-dashed border-orange-300 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <span className="font-bold text-gray-900">Apply Coupon</span>
                  </div>

                  {!appliedCoupon ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={couponValidating}
                          className="flex-1 px-4 py-2.5 text-sm border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white disabled:bg-gray-100"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponValidating || !couponCode.trim()}
                          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {couponValidating ? "Validating..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-600 mt-2 font-medium">{couponError}</p>
                      )}
                      <p className="text-xs text-orange-700 mt-2 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        Get instant discounts with promo codes!
                      </p>
                    </>
                  ) : (
                    <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold text-green-800">{appliedCoupon.code}</span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-sm text-green-700 font-medium">
                        {appliedCoupon.discount_value}% discount applied! You save ₹{appliedCoupon.discount_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium">Base Fare</span>
                    <span className="font-bold text-gray-900">₹{bookingAmount.toLocaleString()}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                        Coupon Discount ({appliedCoupon.discount_value}%)
                      </span>
                      <span className="font-bold">-₹{appliedCoupon.discount_amount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium">GST (Included)</span>
                    <span className="text-green-600 font-bold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      FREE
                    </span>
                  </div>

                  <div className="border-t-2 border-dashed border-gray-300 pt-4 flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-base">Total Amount</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ₹{(appliedCoupon ? appliedCoupon.final_amount : bookingAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-semibold">{error}</p>
                  </div>
                </div>
              )}

              {/* Proceed Button */}
              <Button
                onClick={handleProceedToPayment}
                disabled={processing}
                className="w-full !py-4 !text-base !font-bold !rounded-xl !shadow-lg hover:!shadow-xl !transition-all !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Proceed to Payment
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-green-800 font-bold">
                  Secured by Razorpay
                </p>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
