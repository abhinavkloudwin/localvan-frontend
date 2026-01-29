"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/driver/Sidebar";
import EditVehicleFormDriver from "@/components/driver/EditVehicleFormDriver";
import { VehicleCardSkeleton } from "@/components/ui/Skeleton";
import LocationPickerModal from "@/components/driver/LocationPickerModal";

interface Vehicle {
  id: string;
  vehicle_type: string;
  model: string;
  features: string | null;
  fuel_type: string;
  registration_date: string;
  booking_amount: number;
  is_active: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
  vehicle_images?: string[];
  latitude?: number;
  longitude?: number;
  current_lat?: number | null;
  current_long?: number | null;
  radius?: number;
  driving_mode?: string;
  rc_book_number?: string;
  driving_license_number?: string;
}

export default function DriverVehiclePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Location update states
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationSuccess, setLocationSuccess] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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
        await fetchVehicle();
      } catch (error) {
        console.error("Failed to check auth:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchVehicle = async () => {
    setLoadingVehicle(true);
    try {
      const response = await apiClient.getDriverVehicle();
      console.log("Driver vehicle response:", response);
      if (response) {
        setVehicle(response);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle:", error);
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handleEditVehicle = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    fetchVehicle();
  };

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setUpdatingLocation(true);
    setLocationError("");
    setLocationSuccess("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await apiClient.updateVehicleLocation(latitude, longitude);
          setLocationSuccess(`Location updated successfully! (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
          // Refresh vehicle data to show updated location
          await fetchVehicle();
        } catch (error: any) {
          setLocationError(error.message || "Failed to update location");
        } finally {
          setUpdatingLocation(false);
        }
      },
      (error) => {
        setUpdatingLocation(false);
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleLocationSelect = async (lat: number, lng: number, address?: string) => {
    setUpdatingLocation(true);
    setLocationError("");
    setLocationSuccess("");

    try {
      await apiClient.updateVehicleLocation(lat, lng);
      setLocationSuccess(
        `Location updated successfully!${address ? "\n" + address : ""}\n(${lat.toFixed(6)}, ${lng.toFixed(6)})`
      );
      await fetchVehicle();
    } catch (error: any) {
      setLocationError(error.message || "Failed to update location");
    } finally {
      setUpdatingLocation(false);
    }
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
            <VehicleCardSkeleton />
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
              My Assigned Vehicle
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {vehicle ? "View and update your vehicle information" : "No vehicle currently assigned"}
            </p>
          </div>

          {loadingVehicle ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <VehicleCardSkeleton />
            </div>
          ) : !vehicle ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-12">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Vehicle Assigned for You</h3>
                <p className="text-sm text-gray-500">Please contact your owner/company to get a vehicle assigned</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Vehicle Details</h2>
                  <button onClick={handleEditVehicle} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Edit vehicle">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              <div className="space-y-6">
                {/* Vehicle Images */}
                {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Vehicle Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {vehicle.vehicle_images.map((imageUrl: string, idx: number) => (
                        <img key={idx} src={imageUrl} alt={`Vehicle ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vehicle Type</label>
                    <p className="mt-1 text-gray-900">{vehicle.vehicle_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Model</label>
                    <p className="mt-1 text-gray-900">{vehicle.model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fuel Type</label>
                    <p className="mt-1 text-gray-900">{vehicle.fuel_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Booking Amount</label>
                    <p className="mt-1 text-gray-900">₹{vehicle.booking_amount}</p>
                  </div>
                  {vehicle.rc_book_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">RC Book Number</label>
                      <p className="mt-1 text-gray-900">{vehicle.rc_book_number}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vehicle.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {vehicle.is_active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>

                {vehicle.features && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Features</label>
                    <p className="mt-1 text-gray-900">{vehicle.features}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Location Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-xl font-semibold">Current Location</h2>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Location</label>
                    <div className="mt-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="text-sm font-mono text-gray-700">
                        {vehicle.latitude?.toFixed(6)}, {vehicle.longitude?.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Location</label>
                    <div className="mt-2 flex items-center gap-2">
                      {vehicle.current_lat && vehicle.current_long ? (
                        <>
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-mono text-gray-700">
                            {vehicle.current_lat.toFixed(6)}, {vehicle.current_long.toFixed(6)}
                          </p>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-sm text-gray-500 italic">Not set (using registration location)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {locationSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-700">{locationSuccess}</p>
                  </div>
                )}

                {locationError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{locationError}</p>
                  </div>
                )}

                {/* Update Location Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleUpdateLocation}
                    disabled={updatingLocation}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updatingLocation ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>GPS Location</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowLocationPicker(true)}
                    disabled={updatingLocation}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Choose on Map</span>
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold mb-1">Update your location:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>GPS Location:</strong> Use your device's current GPS coordinates</li>
                        <li><strong>Choose on Map:</strong> Search and select any location on the map</li>
                      </ul>
                      <p className="mt-2">This helps customers find vehicles near them!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
          )}
        </main>
      </div>

      {/* Edit Vehicle Modal */}
      {showEditModal && vehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Vehicle</h2>
              <EditVehicleFormDriver vehicle={vehicle} onSuccess={handleEditSuccess} onCancel={() => setShowEditModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLat={vehicle?.current_lat || vehicle?.latitude || 12.9716}
        initialLng={vehicle?.current_long || vehicle?.longitude || 77.5946}
      />
    </div>
  );
}
