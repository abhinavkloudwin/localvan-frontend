"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu, UserCog, Trash2, Power } from "lucide-react";
import Sidebar from "@/components/owner/Sidebar";
import { AddSubUserForm } from "@/components/owner/AddSubUserForm";
import { Button } from "@/components/ui/Button";
import { VehicleCardSkeleton } from "@/components/ui/Skeleton";

interface SubUser {
  id: string;
  name: string;
  email: string | null;
  mobile_number: string;
  username: string;
  owner_sub_role: string;
  is_active: boolean;
  created_on: string;
}

export default function ManageUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingSubUsers, setLoadingSubUsers] = useState(false);

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
        await fetchSubUsers();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchSubUsers = async () => {
    setLoadingSubUsers(true);
    try {
      const response = await apiClient.getMySubUsers();
      if (response && response.data) {
        setSubUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch sub-users:", error);
    } finally {
      setLoadingSubUsers(false);
    }
  };

  const handleAddSubUserSuccess = () => {
    setShowAddForm(false);
    fetchSubUsers();
  };

  const handleToggleStatus = async (subUserId: string, currentStatus: boolean) => {
    try {
      await apiClient.toggleSubUserStatus(subUserId, !currentStatus);
      fetchSubUsers();
    } catch (error) {
      console.error("Failed to toggle sub-user status:", error);
    }
  };

  const handleDeleteSubUser = async (subUserId: string) => {
    if (!confirm("Are you sure you want to delete this sub-user?")) {
      return;
    }

    try {
      await apiClient.deleteSubUser(subUserId);
      fetchSubUsers();
    } catch (error) {
      console.error("Failed to delete sub-user:", error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "sales":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          user={user}
          isUserLoading={loading}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
            <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
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
        onLogout={handleLogout}
        user={user}
        isUserLoading={loading}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-30">
          <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
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
              Team Members
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your sub-accounts and permissions
            </p>
          </div>

          {!showAddForm ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Manage Users</h2>
                <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </Button>
              </div>

              {loadingSubUsers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                  <VehicleCardSkeleton />
                </div>
              ) : subUsers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <UserCog className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No sub-users added yet</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Click &quot;Add User&quot; to create your first sub-account
                  </p>
                  <Button onClick={() => setShowAddForm(true)} variant="primary">
                    Add Your First Sub-User
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subUsers.map((subUser) => (
                    <div
                      key={subUser.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{subUser.name}</h3>
                          <p className="text-sm text-gray-600">@{subUser.username}</p>
                          <p className="text-sm text-gray-600">{subUser.mobile_number}</p>
                          {subUser.email && (
                            <p className="text-sm text-gray-600">{subUser.email}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                              subUser.owner_sub_role
                            )}`}
                          >
                            {subUser.owner_sub_role.charAt(0).toUpperCase() +
                              subUser.owner_sub_role.slice(1)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              subUser.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {subUser.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-gray-100 pt-4">
                        <button
                          onClick={() => handleToggleStatus(subUser.id, subUser.is_active)}
                          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            subUser.is_active
                              ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          <Power size={16} />
                          {subUser.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteSubUser(subUser.id)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Sub-User</h2>
                  <p className="text-sm text-gray-500">Create a team member account</p>
                </div>
                <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
              <AddSubUserForm onSuccess={handleAddSubUserSuccess} onCancel={() => setShowAddForm(false)} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
