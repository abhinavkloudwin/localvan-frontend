"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/owner/Sidebar";
import AddVehicleForm from "@/components/owner/AddVehicleForm";
import EditVehicleForm from "@/components/owner/EditVehicleForm";
import { Button } from "@/components/ui/Button";
import { VehicleCardSkeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

interface VehicleTypeInfo {
  id: string;
  model_type: string;
  seats: number;
  base_km: number;
  base_fare_ac: number;
  base_fare_non_ac: number;
  per_km_charge_ac: number;
  per_km_charge_non_ac: number;
  category_name?: string;
}

interface Vehicle {
  id: string;
  vehicle_type: string | null;
  vehicle_type_id: string;
  vehicle_type_info?: VehicleTypeInfo;
  is_ac: boolean;
  vehicle_name: string | null;
  model: string | null;
  features: string | null;
  fuel_type: string;
  registration_date: string;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  vehicle_images?: string[];
  driver_id?: string | null;
}

interface Driver {
  id: string;
  name: string;
  email: string | null;
  mobile_number: string;
  is_active: boolean;
}

export default function OwnerVehiclesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

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
        await Promise.all([fetchVehicles(), fetchDrivers()]);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await apiClient.getMyVehicles();
      if (response && response.data) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchDrivers = async () => {
    setDriversLoading(true);
    try {
      const response = await apiClient.getMyDrivers();
      if (response) {
        setDrivers(response.data || response || []);
      }
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setDriversLoading(false);
    }
  };

  const handleAddVehicleSuccess = () => {
    setShowAddVehicleForm(false);
    fetchVehicles();
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowEditVehicleModal(true);
  };

  const handleEditVehicleSuccess = () => {
    setShowEditVehicleModal(false);
    setEditingVehicle(null);
    fetchVehicles();
  };

  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: boolean) => {
    try {
      await apiClient.toggleVehicleStatus(vehicleId, !currentStatus);
      fetchVehicles();
    } catch (error) {
      console.error("Failed to toggle vehicle status:", error);
    }
  };

  const handleImageClick = (imageUrl: string, images: string[], index: number) => {
    setSelectedImage(imageUrl);
    setAllImages(images);
    setCurrentImageIndex(index);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
    setAllImages([]);
    setCurrentImageIndex(0);
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setSelectedImage(allImages[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setSelectedImage(allImages[currentImageIndex + 1]);
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VehicleCardSkeleton />
              <VehicleCardSkeleton />
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
              My Vehicles
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your vehicle fleet
            </p>
          </div>

          {!showAddVehicleForm ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Vehicle List</h2>
                <Button variant="primary" size="sm" onClick={() => setShowAddVehicleForm(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Vehicle
                </Button>
              </div>

              {loadingVehicles ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 mb-4">No vehicles added yet</p>
                  <p className="text-sm text-gray-400">Click "Add Vehicle" to register your first vehicle</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex gap-4 p-4">
                        {/* Vehicle Image */}
                        {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                          <div className="flex-shrink-0">
                            <img
                              src={vehicle.vehicle_images[0]}
                              alt={vehicle.model || "Vehicle"}
                              className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(vehicle.vehicle_images![0], vehicle.vehicle_images || [], 0)}
                            />
                            {vehicle.vehicle_images.length > 1 && (
                              <div className="text-xs text-center text-gray-500 mt-1">
                                +{vehicle.vehicle_images.length - 1} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                            <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}

                        {/* Vehicle Details */}
                        <div className="flex-1 min-w-0">
                          {/* Header with Name and Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {(vehicle as any).vehicle_name || vehicle.model || "Vehicle"}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {vehicle.vehicle_type_info?.model_type && (
                                  <span className="text-sm text-purple-600 font-medium">
                                    {vehicle.vehicle_type_info.model_type}
                                  </span>
                                )}
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-600">
                                  {vehicle.fuel_type} {vehicle.is_ac ? "AC" : "Non-AC"}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 ml-3">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${vehicle.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {vehicle.is_active ? "Active" : "Inactive"}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
                                  vehicle.approval_status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : vehicle.approval_status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {vehicle.approval_status === "approved"
                                  ? "Verified"
                                  : vehicle.approval_status === "rejected"
                                  ? "Rejected"
                                  : "Pending"}
                              </span>
                            </div>
                          </div>

                          {/* Alert Messages */}
                          {vehicle.approval_status === "rejected" && vehicle.rejection_reason && (
                            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs font-semibold text-red-800">Rejection Reason:</p>
                              <p className="text-xs text-red-700 mt-0.5">{vehicle.rejection_reason}</p>
                            </div>
                          )}
                          {vehicle.approval_status === "pending" && (
                            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-xs text-yellow-800">Vehicle under review - you'll be notified once verified</p>
                            </div>
                          )}

                          {/* Key Info Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Driver</p>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {(() => {
                                  const driver = drivers.find((d) => d.id === vehicle.driver_id);
                                  return driver?.name || "—";
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Registered</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(vehicle.registration_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>

                          {/* Features */}
                          {vehicle.features && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {vehicle.features.split(", ").slice(0, 2).map((feature, idx) => (
                                  <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                    {feature}
                                  </span>
                                ))}
                                {vehicle.features.split(", ").length > 2 && (
                                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                    +{vehicle.features.split(", ").length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleVehicleStatus(vehicle.id, vehicle.is_active)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                vehicle.is_active
                                  ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                                  : "text-green-700 bg-green-50 hover:bg-green-100"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {vehicle.is_active ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                ) : (
                                  <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </>
                                )}
                              </svg>
                              {vehicle.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Vehicle</h2>
              <AddVehicleForm onSuccess={handleAddVehicleSuccess} onCancel={() => setShowAddVehicleForm(false)} />
            </div>
          )}
        </main>
      </div>

      {/* Edit Vehicle Modal */}
      {showEditVehicleModal && editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Vehicle</h2>
              <button onClick={() => { setShowEditVehicleModal(false); setEditingVehicle(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EditVehicleForm vehicle={editingVehicle} onSuccess={handleEditVehicleSuccess} onCancel={() => { setShowEditVehicleModal(false); setEditingVehicle(null); }} />
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={handleCloseImageModal}>
          <div className="relative w-full max-w-7xl flex items-center justify-center gap-4">
            <button onClick={handleCloseImageModal} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {allImages.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); handlePreviousImage(); }} disabled={currentImageIndex === 0}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="relative flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img src={selectedImage} alt="Vehicle" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
              {allImages.length > 1 && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white text-sm">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} disabled={currentImageIndex === allImages.length - 1}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
