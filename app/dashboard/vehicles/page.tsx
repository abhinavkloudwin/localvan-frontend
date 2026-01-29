"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

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
  owner_id: string;
  vehicle_type: string | null;
  vehicle_type_id: string;
  vehicle_type_info?: VehicleTypeInfo;
  is_ac: boolean;
  model: string | null;
  vehicle_name: string | null;
  features: string | null;
  fuel_type: string;
  registration_date: string;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  vehicle_images?: string[];
  rc_book_number?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  driving_mode?: string;
}

export default function VehiclesManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [statistics, setStatistics] = useState({
    total_vehicles: 0,
    active_vehicles: 0,
    inactive_vehicles: 0,
    pending_vehicles: 0,
    approved_vehicles: 0,
    rejected_vehicles: 0,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "delete" | "activate" | "deactivate" | "approve" | "reject";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "delete",
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
        await Promise.all([fetchVehicles(), fetchStatistics()]);
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    fetchVehicles();
  }, [approvalFilter]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter((vehicle) =>
        vehicle.vehicle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vehicle_type_info?.model_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.rc_book_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.fuel_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [searchQuery, vehicles]);

  const fetchVehicles = async () => {
    try {
      const response = await apiClient.getAllVehicles(0, 100, approvalFilter || undefined);
      if (response && response.data) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      setError("Failed to load vehicles");
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiClient.getVehicleStatistics();
      if (stats) {
        setStatistics(stats);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Vehicle",
      message: `Are you sure you want to delete ${vehicle.vehicle_name || vehicle.vehicle_type || "N/A"}? This action cannot be undone.`,
      type: "delete",
      onConfirm: async () => {
        try {
          await apiClient.deleteVehicleAdmin(vehicle.id);
          setSuccessMessage(`Vehicle has been deleted successfully`);
          setError("");
          await Promise.all([fetchVehicles(), fetchStatistics()]);
          setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error: any) {
          setError(error.message || "Failed to delete vehicle");
          setSuccessMessage("");
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleToggleStatus = (vehicle: Vehicle) => {
    const action = vehicle.is_active ? "deactivate" : "activate";
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Vehicle`,
      message: `Are you sure you want to ${action} ${vehicle.vehicle_name || vehicle.vehicle_type || "N/A"}?`,
      type: action as "activate" | "deactivate",
      onConfirm: async () => {
        try {
          await apiClient.toggleVehicleStatusAdmin(vehicle.id, !vehicle.is_active);
          setSuccessMessage(
            `Vehicle has been ${action}d successfully`
          );
          setError("");
          await Promise.all([fetchVehicles(), fetchStatistics()]);
          setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error: any) {
          setError(error.message || `Failed to ${action} vehicle`);
          setSuccessMessage("");
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleApproveVehicle = (vehicle: Vehicle) => {
    setConfirmDialog({
      isOpen: true,
      title: "Approve Vehicle",
      message: `Are you sure you want to approve ${vehicle.vehicle_name || vehicle.vehicle_type || "N/A"}?`,
      type: "approve",
      onConfirm: async () => {
        try {
          await apiClient.approveVehicleAdmin(vehicle.id);
          setSuccessMessage("Vehicle has been approved successfully");
          setError("");
          await Promise.all([fetchVehicles(), fetchStatistics()]);
          setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error: any) {
          setError(error.message || "Failed to approve vehicle");
          setSuccessMessage("");
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleRejectVehicle = (vehicle: Vehicle) => {
    setRejectionReason("");
    setConfirmDialog({
      isOpen: true,
      title: "Reject Vehicle",
      message: `Please provide a reason for rejecting ${vehicle.vehicle_name || vehicle.vehicle_type || "N/A"}:`,
      type: "reject",
      onConfirm: async () => {
        if (!rejectionReason.trim()) {
          setError("Rejection reason is required");
          return;
        }
        if (rejectionReason.length < 10) {
          setError("Rejection reason must be at least 10 characters");
          return;
        }
        try {
          await apiClient.rejectVehicleAdmin(vehicle.id, rejectionReason);
          setSuccessMessage("Vehicle has been rejected successfully");
          setError("");
          await Promise.all([fetchVehicles(), fetchStatistics()]);
          setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error: any) {
          setError(error.message || "Failed to reject vehicle");
          setSuccessMessage("");
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setRejectionReason("");
      },
    });
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
              Vehicles Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Total: {statistics.total_vehicles} vehicle{statistics.total_vehicles !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{statistics.total_vehicles}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active</p>
                  <p className="text-xl font-bold text-green-600">{statistics.active_vehicles}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Inactive</p>
                  <p className="text-xl font-bold text-gray-600">{statistics.inactive_vehicles}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-full">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">{statistics.pending_vehicles}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Approved</p>
                  <p className="text-xl font-bold text-green-600">{statistics.approved_vehicles}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Rejected</p>
                  <p className="text-xl font-bold text-red-600">{statistics.rejected_vehicles}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
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

          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Search by name, model, type, RC number, or fuel type..."
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
            <div className="w-full sm:w-auto">
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 appearance-none bg-no-repeat bg-right bg-[length:1.5em_1.5em] cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="">All Vehicles</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type / Fuel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RC Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AC Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval
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
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
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
                              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                            />
                          </svg>
                          <p className="text-lg font-medium">
                            {searchQuery ? "No vehicles match your search." : "No vehicles found"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.vehicle_name || vehicle.model || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.vehicle_type_info?.model_type || "N/A"}</div>
                          <div className="text-sm text-gray-500">{vehicle.fuel_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vehicle.rc_book_number || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vehicle.is_ac ? "AC" : "Non-AC"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vehicle.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {vehicle.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vehicle.approval_status === "approved"
                                ? "bg-green-100 text-green-800"
                                : vehicle.approval_status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {vehicle.approval_status === "approved"
                              ? "Approved"
                              : vehicle.approval_status === "rejected"
                              ? "Rejected"
                              : "Pending"}
                          </span>
                          {vehicle.approval_status === "rejected" && vehicle.rejection_reason && (
                            <div className="mt-1 text-xs text-gray-500" title={vehicle.rejection_reason}>
                              {vehicle.rejection_reason.length > 30
                                ? `${vehicle.rejection_reason.substring(0, 30)}...`
                                : vehicle.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(vehicle.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            {vehicle.approval_status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApproveVehicle(vehicle)}
                                  className="text-green-600 hover:text-green-900 px-3 py-1 border border-green-600 rounded hover:bg-green-50 transition-colors"
                                  title="Approve vehicle"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectVehicle(vehicle)}
                                  className="text-red-600 hover:text-red-900 px-3 py-1 border border-red-600 rounded hover:bg-red-50 transition-colors"
                                  title="Reject vehicle"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleToggleStatus(vehicle)}
                              className={`${
                                vehicle.is_active
                                  ? "text-yellow-600 hover:text-yellow-900"
                                  : "text-gray-600 hover:text-gray-900"
                              } px-3 py-1 border ${
                                vehicle.is_active
                                  ? "border-yellow-600 hover:bg-yellow-50"
                                  : "border-gray-600 hover:bg-gray-50"
                              } rounded transition-colors`}
                              title={vehicle.is_active ? "Deactivate" : "Activate"}
                            >
                              {vehicle.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle)}
                              className="text-red-600 hover:text-red-900 px-3 py-1 border border-red-600 rounded hover:bg-red-50 transition-colors"
                              title="Delete vehicle"
                            >
                              Delete
                            </button>
                          </div>
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
            <p className="text-gray-600 mb-4">{confirmDialog.message}</p>

            {confirmDialog.type === "reject" && (
              <div className="mb-4">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason (minimum 10 characters)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  minLength={10}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/500 characters
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  confirmDialog.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : confirmDialog.type === "activate"
                    ? "bg-green-600 hover:bg-green-700"
                    : confirmDialog.type === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : confirmDialog.type === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
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
