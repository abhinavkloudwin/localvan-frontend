"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User, BrandType } from "@/lib/types";
import { Menu, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Award, ArrowUp, ArrowDown } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";

function BrandTypeManagementContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [brandTypes, setBrandTypes] = useState<BrandType[]>([]);
  const [filteredBrandTypes, setFilteredBrandTypes] = useState<BrandType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statistics, setStatistics] = useState({
    total_brand_types: 0,
    active_brand_types: 0,
    inactive_brand_types: 0,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBrandType, setSelectedBrandType] = useState<BrandType | null>(null);
  const [brandTypeToDelete, setBrandTypeToDelete] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    brand_type: "",
    is_active: true,
    priority: 1,
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
        await Promise.all([fetchBrandTypes(), fetchStatistics()]);
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
      setFilteredBrandTypes(brandTypes);
    } else {
      const filtered = brandTypes.filter((bt) =>
        bt.brand_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBrandTypes(filtered);
    }
  }, [searchQuery, brandTypes]);

  const fetchBrandTypes = async () => {
    try {
      const response = await apiClient.getAllBrandTypes(0, 100, false);
      if (response && response.data) {
        setBrandTypes(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch brand types:", error);
      setError("Failed to load brand types");
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiClient.getBrandTypeStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const handleCreateBrandType = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.createBrandType({
        brand_type: formData.brand_type,
        is_active: formData.is_active,
        priority: formData.priority || undefined,
      });

      setSuccess("Brand type created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      await Promise.all([fetchBrandTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to create brand type:", error);
      setError(error?.message || "Failed to create brand type");
    } finally {
      setProcessing(false);
    }
  };

  const handleEditBrandType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandType) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.updateBrandType(selectedBrandType.id, {
        brand_type: formData.brand_type,
        is_active: formData.is_active,
        priority: formData.priority,
      });

      setSuccess("Brand type updated successfully");
      setIsEditModalOpen(false);
      setSelectedBrandType(null);
      resetForm();
      await Promise.all([fetchBrandTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to update brand type:", error);
      setError(error?.message || "Failed to update brand type");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteBrandType = async () => {
    if (!brandTypeToDelete) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.deleteBrandType(brandTypeToDelete);

      setSuccess("Brand type deleted successfully");
      setIsDeleteModalOpen(false);
      setBrandTypeToDelete(null);
      await Promise.all([fetchBrandTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to delete brand type:", error);
      setError(error?.message || "Failed to delete brand type");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (brandType: BrandType) => {
    try {
      await apiClient.updateBrandType(brandType.id, {
        is_active: !brandType.is_active,
      });

      setSuccess(`Brand type ${!brandType.is_active ? "activated" : "deactivated"} successfully`);
      await Promise.all([fetchBrandTypes(), fetchStatistics()]);
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      setError(error?.message || "Failed to update status");
    }
  };

  const handlePriorityChange = async (brandType: BrandType, direction: "up" | "down") => {
    const newPriority = direction === "up" ? brandType.priority - 1 : brandType.priority + 1;
    if (newPriority < 1) return;

    try {
      await apiClient.updateBrandTypePriority(brandType.id, newPriority);
      setSuccess("Priority updated successfully");
      await fetchBrandTypes();
    } catch (error: any) {
      console.error("Failed to update priority:", error);
      setError(error?.message || "Failed to update priority");
    }
  };

  const openEditModal = (brandType: BrandType) => {
    setSelectedBrandType(brandType);
    setFormData({
      brand_type: brandType.brand_type,
      is_active: brandType.is_active,
      priority: brandType.priority,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setBrandTypeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      brand_type: "",
      is_active: true,
      priority: brandTypes.length + 1,
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
              Brand Type Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create and manage brand types for vehicles
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
                  <p className="text-sm font-medium text-gray-600">Total Brand Types</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_brand_types}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.active_brand_types}</p>
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
                  <p className="text-2xl font-bold text-gray-400">{statistics.inactive_brand_types}</p>
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
                placeholder="Search brand types..."
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
              Add Brand Type
            </Button>
          </div>

          {/* Brand Types Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBrandTypes.map((bt, index) => (
                    <tr key={bt.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-900">{bt.priority}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => handlePriorityChange(bt, "up")}
                              disabled={bt.priority === 1}
                              className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handlePriorityChange(bt, "down")}
                              disabled={index === filteredBrandTypes.length - 1}
                              className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bt.brand_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            bt.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {bt.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bt.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleStatus(bt)}
                          className="text-blue-600 hover:text-blue-900"
                          title={bt.is_active ? "Deactivate" : "Activate"}
                        >
                          {bt.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => openEditModal(bt)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(bt.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBrandTypes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No brand types found
                      </td>
                    </tr>
                  )}
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
        title="Create Brand Type"
      >
        <form onSubmit={handleCreateBrandType} className="space-y-4">
          <Input
            label="Brand Type Name"
            value={formData.brand_type}
            onChange={(e) => setFormData({ ...formData, brand_type: e.target.value })}
            placeholder="e.g., Toyota, Honda, Ford"
            required
          />

          <Input
            label="Priority (optional - auto-assigned if empty)"
            type="number"
            value={formData.priority || ""}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            min={1}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
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
          setSelectedBrandType(null);
          resetForm();
        }}
        title="Edit Brand Type"
      >
        <form onSubmit={handleEditBrandType} className="space-y-4">
          <Input
            label="Brand Type Name"
            value={formData.brand_type}
            onChange={(e) => setFormData({ ...formData, brand_type: e.target.value })}
            required
          />

          <Input
            label="Priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            min={1}
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit-is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="edit-is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedBrandType(null);
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
          setBrandTypeToDelete(null);
        }}
        title="Delete Brand Type"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this brand type? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setBrandTypeToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBrandType}
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

export default function BrandTypeManagement() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandTypeManagementContent />
    </Suspense>
  );
}
