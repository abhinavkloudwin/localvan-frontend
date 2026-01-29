"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/owner/Sidebar";
import { AddDriverForm } from "@/components/owner/AddDriverForm";
import { EditDriverForm } from "@/components/owner/EditDriverForm";
import { Button } from "@/components/ui/Button";
import { VehicleCardSkeleton } from "@/components/ui/Skeleton";

interface Driver {
  id: string;
  name: string;
  email: string | null;
  mobile_number: string;
  driving_license_number: string | null;
  driving_license_url: string | null;
  is_active: boolean;
  owner_id: string | null;
}

export default function OwnerDriversPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDriverForm, setShowAddDriverForm] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);

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
        await fetchDrivers();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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
      filtered = filtered.filter(
        (driver) =>
          driver.name?.toLowerCase().includes(query) ||
          driver.mobile_number?.toLowerCase().includes(query) ||
          driver.email?.toLowerCase().includes(query) ||
          driver.driving_license_number?.toLowerCase().includes(query)
      );
    }

    setFilteredDrivers(filtered);
  }, [searchQuery, drivers, statusFilter]);

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const response = await apiClient.getMyDrivers();
      if (response && response.data) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAddDriverSuccess = () => {
    setShowAddDriverForm(false);
    fetchDrivers();
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setShowEditDriverModal(true);
  };

  const handleEditDriverSuccess = () => {
    setShowEditDriverModal(false);
    setEditingDriver(null);
    fetchDrivers();
  };

  const handleToggleDriverStatus = async (driverId: string, currentStatus: boolean) => {
    try {
      await apiClient.toggleDriverStatus(driverId, !currentStatus);
      fetchDrivers();
    } catch (error) {
      console.error("Failed to toggle driver status:", error);
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
              My Drivers
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your driver team
            </p>
          </div>

          {!showAddDriverForm ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Driver List</h2>
                <Button variant="primary" size="sm" onClick={() => setShowAddDriverForm(true)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Driver
                </Button>
              </div>

              {/* Search & Status Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative w-full sm:w-96">
                  <input
                    type="text"
                    placeholder="Search drivers by name, mobile, email, or license..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {loadingDrivers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 mb-4">{drivers.length === 0 ? "No drivers added yet" : "No drivers match your search"}</p>
                  <p className="text-sm text-gray-400">{drivers.length === 0 ? "Click \"Add Driver\" to register your first driver" : "Try adjusting your search or filters"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredDrivers.map((driver) => (
                    <div key={driver.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                          <p className="text-sm text-gray-600">{driver.mobile_number}</p>
                          {driver.email && <p className="text-sm text-gray-600">{driver.email}</p>}
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${driver.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {driver.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {driver.driving_license_number && (
                        <div className="mb-4">
                          <span className="text-sm text-gray-600">License No:</span>
                          <span className="ml-2 text-sm text-gray-900 font-medium">{driver.driving_license_number}</span>
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <button onClick={() => handleEditDriver(driver)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Edit driver">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleDriverStatus(driver.id, driver.is_active)}
                          className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${driver.is_active ? "text-green-600" : "text-gray-400"}`}
                          title={driver.is_active ? "Deactivate driver" : "Activate driver"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Driver</h2>
              <AddDriverForm onSuccess={handleAddDriverSuccess} onCancel={() => setShowAddDriverForm(false)} />
            </div>
          )}
        </main>
      </div>

      {/* Edit Driver Modal */}
      {showEditDriverModal && editingDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900">Edit Driver</h2>
              <button onClick={() => { setShowEditDriverModal(false); setEditingDriver(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EditDriverForm driver={editingDriver} onSuccess={handleEditDriverSuccess} onCancel={() => { setShowEditDriverModal(false); setEditingDriver(null); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
