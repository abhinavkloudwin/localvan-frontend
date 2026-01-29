"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User, AuditLogEntry } from "@/lib/types";
import { Menu, History } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Driver {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
  driving_license_number: string;
  driving_license_url: string;
  is_active: boolean;
  owner_id: string;
  created_on: string;
  updated_on: string;
  assigned_vehicle?: {
    id: string;
    vehicle_name?: string | null;
    model: string;
    vehicle_type: string | null;
    rc_book_number?: string | null;
    registration_date?: string;
  } | null;
}

export default function DriversManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [owners, setOwners] = useState<User[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [addDriverForm, setAddDriverForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    driving_license_number: "",
    owner_id: "",
    driving_license_file: null as File | null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "delete" | "activate" | "deactivate";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "delete",
  });

  // Audit history state
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

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
        await fetchDrivers();
        await fetchOwners();
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    let filtered = [...drivers];

    if (statusFilter !== "all") {
      filtered = filtered.filter((driver) =>
        statusFilter === "active" ? driver.is_active : !driver.is_active
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((driver) =>
        driver.name?.toLowerCase().includes(query) ||
        driver.mobile_number?.toLowerCase().includes(query) ||
        driver.email?.toLowerCase().includes(query) ||
        driver.driving_license_number?.toLowerCase().includes(query)
      );
    }

    setFilteredDrivers(filtered);
  }, [searchQuery, drivers, statusFilter]);

  const fetchDrivers = async () => {
    try {
      const response = await apiClient.getAllDrivers();
      if (response && response.data) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
      setError("Failed to load drivers");
    }
  };

  const fetchOwners = async () => {
    setOwnersLoading(true);
    try {
      const response = await apiClient.getPrimaryOwners();

      // Handle paginated response
      if (response && response.data) {
        setOwners(response.data);
      } else {
        setOwners([]);
      }
    } catch (error) {
      console.error("Failed to fetch owners:", error);
      setOwners([]);
    } finally {
      setOwnersLoading(false);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addDriverForm.driving_license_file) {
      setError("Please select a driving license file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", addDriverForm.name);
      formData.append("email", addDriverForm.email);
      formData.append("mobile_number", addDriverForm.mobile_number);
      formData.append("driving_license_number", addDriverForm.driving_license_number);
      formData.append("owner_id", addDriverForm.owner_id);
      formData.append("driving_license_file", addDriverForm.driving_license_file);

      await apiClient.addDriverAdmin(formData);
      setSuccessMessage("Driver added successfully");
      setError("");
      setShowAddModal(false);
      setAddDriverForm({
        name: "",
        email: "",
        mobile_number: "",
        driving_license_number: "",
        owner_id: "",
        driving_license_file: null,
      });
      await fetchDrivers();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Add driver error:", error);
      // Extract the most user-friendly error message
      let errorMessage = "Failed to add driver";

      if (error.message) {
        // Check if it's a validation error with detailed message
        if (error.message.includes("validation error")) {
          // Extract the specific field error from the message
          const match = error.message.match(/Value error, (.+?)(?:\[type|$)/);
          if (match) {
            errorMessage = match[1].trim();
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setSuccessMessage("");
    }
  };

  const handleDeleteDriver = (driver: Driver) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Driver",
      message: `Are you sure you want to delete ${driver.name}? This action cannot be undone.`,
      type: "delete",
      onConfirm: async () => {
        try {
          await apiClient.deleteDriverAdmin(driver.id);
          setSuccessMessage(`Driver ${driver.name} has been deleted successfully`);
          setError("");
          await fetchDrivers();
          setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error: any) {
          setError(error.message || "Failed to delete driver");
          setSuccessMessage("");
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleViewAuditHistory = async (driver: Driver) => {
    setSelectedDriver(driver);
    setLoadingAudit(true);
    setIsAuditModalOpen(true);

    try {
      const response = await apiClient.getDriverAuditHistory(driver.id);
      setAuditHistory(response.data || []);
    } catch (error) {
      console.error("Failed to fetch audit history:", error);
      setAuditHistory([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      create: "Created",
      update: "Updated",
      verify: "Verified",
      delete: "Deleted",
    };
    return actionMap[action] || action;
  };

  const handleToggleStatus = (driver: Driver) => {
    const action = driver.is_active ? "deactivate" : "activate";
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Driver`,
      message: `Are you sure you want to ${action} ${driver.name}?`,
      type: action as "activate" | "deactivate",
      onConfirm: async () => {
        try {
          await apiClient.toggleDriverStatusAdmin(driver.id, !driver.is_active);
          setSuccessMessage(
            `Driver ${driver.name} has been ${action}d successfully`
          );
          setError("");
          await fetchDrivers();
          setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error: any) {
          setError(error.message || `Failed to ${action} driver`);
          setSuccessMessage("");
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
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
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Drivers Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Total: {drivers.length} driver{drivers.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              + Add Driver
            </Button>
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

          {/* Search & Status Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search by name, mobile, email, or license number..."
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

            <div className="flex flex-wrap gap-2">
              {["all", "active", "inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors capitalize ${
                    statusFilter === status
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <p className="text-lg font-medium">
                            {drivers.length === 0 ? "No drivers found" : "No drivers match your search or filters"}
                          </p>
                          {(searchQuery || statusFilter !== "all") && drivers.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              Try adjusting your search or filters
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <tr key={driver.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.mobile_number}</div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {driver.driving_license_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.assigned_vehicle ? (
                            <div className="text-sm space-y-0.5">
                              <div className="font-medium text-gray-900">
                                {driver.assigned_vehicle.vehicle_name ||
                                  driver.assigned_vehicle.model ||
                                  "Assigned Vehicle"}
                              </div>
                              <div className="text-gray-500 capitalize">
                                {driver.assigned_vehicle.vehicle_type ||
                                  (driver.assigned_vehicle.rc_book_number
                                    ? `RC: ${driver.assigned_vehicle.rc_book_number}`
                                    : `ID: ${driver.assigned_vehicle.id.slice(0, 6)}…`)}
                              </div>
                              {driver.assigned_vehicle.registration_date && (
                                <div className="text-xs text-gray-400">
                                  Reg.{" "}
                                  {new Date(
                                    driver.assigned_vehicle.registration_date
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                              No Vehicle
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              driver.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {driver.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(driver.created_on).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewAuditHistory(driver)}
                            className="text-purple-600 hover:text-purple-900 p-2 border border-purple-600 rounded hover:bg-purple-50 transition-colors cursor-pointer"
                            title="View Audit History"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(driver)}
                            className={`${
                              driver.is_active
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            } p-2 border ${
                              driver.is_active
                                ? "border-yellow-600 hover:bg-yellow-50"
                                : "border-green-600 hover:bg-green-50"
                            } rounded transition-colors cursor-pointer`}
                            title={driver.is_active ? "Deactivate" : "Activate"}
                          >
                            {driver.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(driver)}
                            className="text-red-600 hover:text-red-900 p-2 border border-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete driver"
                          >
                            Delete
                          </button>
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

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Driver
            </h3>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddDriver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <select
                  value={addDriverForm.owner_id}
                  onChange={(e) =>
                    setAddDriverForm({ ...addDriverForm, owner_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  disabled={ownersLoading}
                >
                  <option value="">{ownersLoading ? "Loading owners..." : "Select Owner"}</option>
                  {owners.length === 0 && !ownersLoading ? (
                    <option value="" disabled>No owners found</option>
                  ) : (
                    owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email || owner.mobile_number}) - ID: {owner.id.slice(0, 8)}...
                      </option>
                    ))
                  )}
                </select>
                {owners.length === 0 && !ownersLoading && (
                  <p className="mt-1 text-xs text-red-600">
                    No owners available. Please create an owner account first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={addDriverForm.name}
                  onChange={(e) =>
                    setAddDriverForm({ ...addDriverForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={addDriverForm.email}
                  onChange={(e) =>
                    setAddDriverForm({ ...addDriverForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={addDriverForm.mobile_number}
                  onChange={(e) =>
                    setAddDriverForm({ ...addDriverForm, mobile_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driving License Number
                </label>
                <input
                  type="text"
                  value={addDriverForm.driving_license_number}
                  onChange={(e) =>
                    setAddDriverForm({
                      ...addDriverForm,
                      driving_license_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driving License File
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setAddDriverForm({
                      ...addDriverForm,
                      driving_license_file: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddDriverForm({
                      name: "",
                      email: "",
                      mobile_number: "",
                      driving_license_number: "",
                      owner_id: "",
                      driving_license_file: null,
                    });
                  }}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Add Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, isOpen: false })
                }
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
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`Audit History - ${selectedDriver?.name || "Driver"}`}
        size="lg"
      >
        <div className="space-y-4">
          {loadingAudit ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading audit history...</p>
            </div>
          ) : auditHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit history found
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {auditHistory.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.action === "create"
                            ? "bg-green-100 text-green-800"
                            : log.action === "update"
                            ? "bg-blue-100 text-blue-800"
                            : log.action === "verify"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {formatAction(log.action)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{log.admin_name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                  )}
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.ip_address && (
                    <div className="mt-2 text-xs text-gray-400">IP: {log.ip_address}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
