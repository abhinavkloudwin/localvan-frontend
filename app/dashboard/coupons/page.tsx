"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Coupon {
  id: string;
  title: string;
  description: string;
  valid_from: string;
  valid_till: string;
  coupon_code: string;
  discount_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function CouponManagementContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [statistics, setStatistics] = useState({
    total_coupons: 0,
    active_coupons: 0,
    valid_coupons: 0,
    expired_coupons: 0,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [processingCoupon, setProcessingCoupon] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    valid_from: "",
    valid_till: "",
    coupon_code: "",
    discount_value: "",
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
        await Promise.all([fetchCoupons(), fetchStatistics()]);
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
      setFilteredCoupons(coupons);
    } else {
      const filtered = coupons.filter((coupon) =>
        coupon.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.coupon_code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCoupons(filtered);
    }
  }, [searchQuery, coupons]);

  const fetchCoupons = async () => {
    try {
      const response = await apiClient.getAllCoupons();
      if (response && response.data) {
        setCoupons(response.data);
        setTotalCoupons(response.total || response.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setError("Failed to load coupons");
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiClient.getCouponStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      valid_from: "",
      valid_till: "",
      coupon_code: "",
      discount_value: "",
    });
    setSelectedCoupon(null);
  };

  const handleCreateCoupon = async () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.valid_from ||
      !formData.valid_till ||
      !formData.coupon_code ||
      !formData.discount_value
    ) {
      setError("All fields are required");
      return;
    }

    setProcessingCoupon(true);
    setError("");

    try {
      await apiClient.createCoupon({
        title: formData.title,
        description: formData.description,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_till: new Date(formData.valid_till).toISOString(),
        coupon_code: formData.coupon_code,
        discount_value: parseFloat(formData.discount_value),
      });

      setSuccess("Coupon created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      await Promise.all([fetchCoupons(), fetchStatistics()]);
    } catch (err: any) {
      setError(err.message || "Failed to create coupon");
    } finally {
      setProcessingCoupon(false);
    }
  };

  const handleEditCoupon = async () => {
    if (!selectedCoupon) return;

    setProcessingCoupon(true);
    setError("");

    try {
      const updateData: any = {};
      if (formData.title) updateData.title = formData.title;
      if (formData.description) updateData.description = formData.description;
      if (formData.valid_from)
        updateData.valid_from = new Date(formData.valid_from).toISOString();
      if (formData.valid_till)
        updateData.valid_till = new Date(formData.valid_till).toISOString();
      if (formData.coupon_code) updateData.coupon_code = formData.coupon_code;
      if (formData.discount_value)
        updateData.discount_value = parseFloat(formData.discount_value);

      await apiClient.updateCoupon(selectedCoupon.id, updateData);

      setSuccess("Coupon updated successfully");
      setIsEditModalOpen(false);
      resetForm();
      await fetchCoupons();
    } catch (err: any) {
      setError(err.message || "Failed to update coupon");
    } finally {
      setProcessingCoupon(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await apiClient.toggleCouponStatus(coupon.id, !coupon.is_active);
      setSuccess(
        `Coupon ${coupon.is_active ? "deactivated" : "activated"} successfully`
      );
      await Promise.all([fetchCoupons(), fetchStatistics()]);
    } catch (err: any) {
      setError(err.message || "Failed to toggle coupon status");
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.title}"?`))
      return;

    try {
      await apiClient.deleteCoupon(coupon.id);
      setSuccess("Coupon deleted successfully");
      await Promise.all([fetchCoupons(), fetchStatistics()]);
    } catch (err: any) {
      setError(err.message || "Failed to delete coupon");
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      title: coupon.title,
      description: coupon.description,
      valid_from: coupon.valid_from.split("T")[0],
      valid_till: coupon.valid_till.split("T")[0],
      coupon_code: coupon.coupon_code,
      discount_value: coupon.discount_value.toString(),
    });
    setIsEditModalOpen(true);
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
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <TableSkeleton rows={8} />
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
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
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Coupon Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create and manage discount coupons
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.total_coupons}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Active Coupons</p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.active_coupons}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Valid Now</p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.valid_coupons}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">Expired</p>
              <p className="text-2xl font-bold text-red-600">
                {statistics.expired_coupons}
              </p>
            </div>
          </div>

          {/* Create Button */}
          <div className="mb-6">
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create New Coupon
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search by title, code, or description..."
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
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code / Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          {searchQuery ? "No coupons match your search." : "No coupons found"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-bold text-gray-900">
                              {coupon.coupon_code}
                            </div>
                            <div className="text-sm text-gray-500">{coupon.title}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-600">
                            {coupon.discount_value}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(coupon.valid_from).toLocaleDateString()} -
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(coupon.valid_till).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              coupon.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {coupon.is_active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleToggleStatus(coupon)}
                              className="text-blue-600 hover:text-blue-900"
                              title={
                                coupon.is_active ? "Deactivate" : "Activate"
                              }
                            >
                              {coupon.is_active ? (
                                <ToggleRight size={20} />
                              ) : (
                                <ToggleLeft size={20} />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(coupon)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 size={18} />
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

        {/* Create Coupon Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            resetForm();
            setError("");
          }}
          title="Create New Coupon"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Summer Sale"
            />

            <div>
              <label className="block text-base font-bold mb-2 text-black">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter coupon description"
              />
            </div>

            <Input
              label="Coupon Code"
              value={formData.coupon_code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coupon_code: e.target.value.toUpperCase(),
                })
              }
              placeholder="e.g., SAVE20"
            />

            <Input
              label="Discount Value (%)"
              type="number"
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({ ...formData, discount_value: e.target.value })
              }
              placeholder="e.g., 20"
              min="0"
              max="100"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valid From"
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
                }
              />
              <Input
                label="Valid Till"
                type="date"
                value={formData.valid_till}
                onChange={(e) =>
                  setFormData({ ...formData, valid_till: e.target.value })
                }
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                  setError("");
                }}
                disabled={processingCoupon}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCreateCoupon}
                disabled={processingCoupon}
              >
                {processingCoupon ? "Creating..." : "Create Coupon"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Coupon Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            resetForm();
            setError("");
          }}
          title="Edit Coupon"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />

            <div>
              <label className="block text-base font-bold mb-2 text-black">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            <Input
              label="Coupon Code"
              value={formData.coupon_code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coupon_code: e.target.value.toUpperCase(),
                })
              }
            />

            <Input
              label="Discount Value (%)"
              type="number"
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({ ...formData, discount_value: e.target.value })
              }
              min="0"
              max="100"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valid From"
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
                }
              />
              <Input
                label="Valid Till"
                type="date"
                value={formData.valid_till}
                onChange={(e) =>
                  setFormData({ ...formData, valid_till: e.target.value })
                }
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                  setError("");
                }}
                disabled={processingCoupon}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleEditCoupon}
                disabled={processingCoupon}
              >
                {processingCoupon ? "Updating..." : "Update Coupon"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default function CouponManagement() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CouponManagementContent />
    </Suspense>
  );
}
