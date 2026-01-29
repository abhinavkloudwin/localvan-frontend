"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User, VehicleType, VehicleCategory, BrandType } from "@/lib/types";
import { Menu, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Package } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

function VehicleTypeManagementContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [brandTypes, setBrandTypes] = useState<BrandType[]>([]);
  const [filteredVehicleTypes, setFilteredVehicleTypes] = useState<VehicleType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statistics, setStatistics] = useState({
    total_vehicle_types: 0,
    active_vehicle_types: 0,
    inactive_vehicle_types: 0,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
  const [vehicleTypeToDelete, setVehicleTypeToDelete] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    model_type: "",
    vehicle_category_id: "",
    brand_type_id: "",
    seats: 0,
    base_km: 0,
    base_fare_ac: 0,
    base_fare_non_ac: 0,
    per_km_charge_ac: 0,
    per_km_charge_non_ac: 0,
    base_fare_commission: 0,
    per_km_commission: 0,
    status: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
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

        setUser(userData);
        await Promise.all([fetchVehicleTypes(), fetchStatistics(), fetchCategories(), fetchBrandTypes()]);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVehicleTypes(vehicleTypes);
    } else {
      const filtered = vehicleTypes.filter((vt) =>
        vt.model_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vt.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVehicleTypes(filtered);
    }
  }, [searchQuery, vehicleTypes]);

  const fetchVehicleTypes = async () => {
    try {
      const response = await apiClient.getAllVehicleTypes(0, 100, false, true);
      if (response && response.data) {
        setVehicleTypes(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle types:", error);
      setError("Failed to load vehicle types");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getAllVehicleCategories(0, 100, true);
      if (response && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchBrandTypes = async () => {
    try {
      const response = await apiClient.getAllBrandTypes(0, 100, true);
      if (response && response.data) {
        setBrandTypes(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch brand types:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiClient.getVehicleTypeStatistics();
      if (response && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const handleCreateVehicleType = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.createVehicleType({
        ...formData,
        brand_type_id: formData.brand_type_id || undefined,
      });

      setSuccess("Vehicle type created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      await Promise.all([fetchVehicleTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to create vehicle type:", error);
      setError(error?.message || "Failed to create vehicle type");
    } finally {
      setProcessing(false);
    }
  };

  const handleEditVehicleType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleType) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.updateVehicleType(selectedVehicleType.id, {
        ...formData,
        brand_type_id: formData.brand_type_id || undefined,
      });

      setSuccess("Vehicle type updated successfully");
      setIsEditModalOpen(false);
      setSelectedVehicleType(null);
      resetForm();
      await Promise.all([fetchVehicleTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to update vehicle type:", error);
      setError(error?.message || "Failed to update vehicle type");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteVehicleType = async () => {
    if (!vehicleTypeToDelete) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.deleteVehicleType(vehicleTypeToDelete);

      setSuccess("Vehicle type deleted successfully");
      setIsDeleteModalOpen(false);
      setVehicleTypeToDelete(null);
      await Promise.all([fetchVehicleTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to delete vehicle type:", error);
      setError(error?.message || "Failed to delete vehicle type");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (vehicleType: VehicleType) => {
    try {
      await apiClient.updateVehicleType(vehicleType.id, {
        status: !vehicleType.status,
      });

      setSuccess(`Vehicle type ${!vehicleType.status ? "activated" : "deactivated"} successfully`);
      await Promise.all([fetchVehicleTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      setError(error?.message || "Failed to update status");
    }
  };

  const openEditModal = (vehicleType: VehicleType) => {
    setSelectedVehicleType(vehicleType);
    setFormData({
      model_type: vehicleType.model_type,
      vehicle_category_id: vehicleType.vehicle_category_id,
      brand_type_id: vehicleType.brand_type_id || "",
      seats: vehicleType.seats,
      base_km: vehicleType.base_km,
      base_fare_ac: vehicleType.base_fare_ac,
      base_fare_non_ac: vehicleType.base_fare_non_ac,
      per_km_charge_ac: vehicleType.per_km_charge_ac,
      per_km_charge_non_ac: vehicleType.per_km_charge_non_ac,
      base_fare_commission: vehicleType.base_fare_commission,
      per_km_commission: vehicleType.per_km_commission,
      status: vehicleType.status,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setVehicleTypeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      model_type: "",
      vehicle_category_id: "",
      brand_type_id: "",
      seats: 0,
      base_km: 0,
      base_fare_ac: 0,
      base_fare_non_ac: 0,
      per_km_charge_ac: 0,
      per_km_charge_non_ac: 0,
      base_fare_commission: 0,
      per_km_commission: 0,
      status: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
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
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Vehicle Type Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create and manage vehicle types with pricing configuration
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-800 underline text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
              <button
                onClick={() => setSuccess("")}
                className="text-green-800 underline text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicle Types</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_vehicle_types}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.active_vehicle_types}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <ToggleRight className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-400">{statistics.inactive_vehicle_types}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="w-full sm:w-auto sm:flex-1 sm:max-w-md">
              <Input
                type="text"
                placeholder="Search by model type or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle Type
            </Button>
          </div>

          {/* Vehicle Types Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base KM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Fare (AC)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per KM (AC)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicleTypes.map((vt) => (
                    <tr key={vt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vt.model_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vt.category_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vt.brand_type_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vt.seats}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vt.base_km} km</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{vt.base_fare_ac}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{vt.per_km_charge_ac}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vt.status
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {vt.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleStatus(vt)}
                          className="text-blue-600 hover:text-blue-900"
                          title={vt.status ? "Deactivate" : "Activate"}
                        >
                          {vt.status ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => openEditModal(vt)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(vt.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create Vehicle Type"
      >
        <form onSubmit={handleCreateVehicleType} className="space-y-4">
          <Input
            label="Model Type"
            value={formData.model_type}
            onChange={(e) => setFormData({ ...formData, model_type: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.vehicle_category_id}
              onChange={(e) => setFormData({ ...formData, vehicle_category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.category_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Type</label>
            <select
              value={formData.brand_type_id}
              onChange={(e) => setFormData({ ...formData, brand_type_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Select Brand Type (Optional)</option>
              {brandTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.brand_type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Seats"
              type="number"
              value={formData.seats}
              onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Base KM"
              type="number"
              value={formData.base_km}
              onChange={(e) => setFormData({ ...formData, base_km: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Fare (AC)"
              type="number"
              step="0.01"
              value={formData.base_fare_ac}
              onChange={(e) => setFormData({ ...formData, base_fare_ac: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Base Fare (Non-AC)"
              type="number"
              step="0.01"
              value={formData.base_fare_non_ac}
              onChange={(e) => setFormData({ ...formData, base_fare_non_ac: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Per KM Charge (AC)"
              type="number"
              step="0.01"
              value={formData.per_km_charge_ac}
              onChange={(e) => setFormData({ ...formData, per_km_charge_ac: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Per KM Charge (Non-AC)"
              type="number"
              step="0.01"
              value={formData.per_km_charge_non_ac}
              onChange={(e) => setFormData({ ...formData, per_km_charge_non_ac: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Fare Commission (%)"
              type="number"
              step="0.01"
              value={formData.base_fare_commission}
              onChange={(e) => setFormData({ ...formData, base_fare_commission: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Per KM Commission (%)"
              type="number"
              step="0.01"
              value={formData.per_km_commission}
              onChange={(e) => setFormData({ ...formData, per_km_commission: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="status"
              checked={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="status" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicleType(null);
          resetForm();
        }}
        title="Edit Vehicle Type"
      >
        <form onSubmit={handleEditVehicleType} className="space-y-4">
          <Input
            label="Model Type"
            value={formData.model_type}
            onChange={(e) => setFormData({ ...formData, model_type: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.vehicle_category_id}
              onChange={(e) => setFormData({ ...formData, vehicle_category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.category_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Type</label>
            <select
              value={formData.brand_type_id}
              onChange={(e) => setFormData({ ...formData, brand_type_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Select Brand Type (Optional)</option>
              {brandTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.brand_type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Seats"
              type="number"
              value={formData.seats}
              onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Base KM"
              type="number"
              value={formData.base_km}
              onChange={(e) => setFormData({ ...formData, base_km: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Fare (AC)"
              type="number"
              step="0.01"
              value={formData.base_fare_ac}
              onChange={(e) => setFormData({ ...formData, base_fare_ac: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Base Fare (Non-AC)"
              type="number"
              step="0.01"
              value={formData.base_fare_non_ac}
              onChange={(e) => setFormData({ ...formData, base_fare_non_ac: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Per KM Charge (AC)"
              type="number"
              step="0.01"
              value={formData.per_km_charge_ac}
              onChange={(e) => setFormData({ ...formData, per_km_charge_ac: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Per KM Charge (Non-AC)"
              type="number"
              step="0.01"
              value={formData.per_km_charge_non_ac}
              onChange={(e) => setFormData({ ...formData, per_km_charge_non_ac: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Fare Commission (%)"
              type="number"
              step="0.01"
              value={formData.base_fare_commission}
              onChange={(e) => setFormData({ ...formData, base_fare_commission: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Per KM Commission (%)"
              type="number"
              step="0.01"
              value={formData.per_km_commission}
              onChange={(e) => setFormData({ ...formData, per_km_commission: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit-status"
              checked={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="edit-status" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedVehicleType(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setVehicleTypeToDelete(null);
        }}
        title="Delete Vehicle Type"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this vehicle type? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setVehicleTypeToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteVehicleType}
            disabled={processing}
            className="bg-red-600 hover:bg-red-700"
          >
            {processing ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function VehicleTypeManagement() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VehicleTypeManagementContent />
    </Suspense>
  );
}
