"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User, Permission, SubAdminCreate } from "@/lib/types";
import { Menu, Plus, UserCog, X, Shield, Mail, Phone, Edit, Trash2, Power } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function SubAdminsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subAdmins, setSubAdmins] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredSubAdmins, setFilteredSubAdmins] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState<SubAdminCreate>({
    name: "",
    mobile_number: "",
    email: "",
    gender: "Male",
    username: "",
    password: "",
    permission_ids: [],
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

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

        // Fetch sub-admins and permissions
        const [subAdminsData, permissionsData] = await Promise.all([
          apiClient.getAllSubAdmins(0, 1000),
          apiClient.getAllPermissions(0, 1000, true), // Only active permissions
        ]);

        setSubAdmins(subAdminsData);
        setFilteredSubAdmins(subAdminsData);
        setPermissions(permissionsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSubAdmins(subAdmins);
    } else {
      const filtered = subAdmins.filter(
        (admin) =>
          admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          admin.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubAdmins(filtered);
    }
  }, [searchQuery, subAdmins]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const openCreateModal = () => {
    setFormData({
      name: "",
      mobile_number: "",
      email: "",
      gender: "Male",
      username: "",
      password: "",
      permission_ids: [],
    });
    setSelectedPermissions([]);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedPermissions.length === 0) {
      setError("Please select at least one permission");
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        permission_ids: selectedPermissions,
      };

      const created = await apiClient.createSubAdmin(dataToSubmit);
      setSubAdmins([...subAdmins, created]);
      setShowCreateModal(false);
      setSuccessMessage("Sub-admin created successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sub-admin");
      setTimeout(() => setError(""), 3000);
    }
  };

  const openPermissionsModal = async (subAdmin: User) => {
    setSelectedSubAdmin(subAdmin);
    try {
      const perms = await apiClient.getUserPermissions(subAdmin.id);
      setUserPermissions(perms);
      setSelectedPermissions(perms.map((p) => p.id));
      setShowPermissionsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load permissions");
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedSubAdmin) return;

    try {
      await apiClient.assignPermissionsToUser(selectedSubAdmin.id, selectedPermissions);
      setShowPermissionsModal(false);
      setSuccessMessage("Permissions updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update permissions");
      setTimeout(() => setError(""), 3000);
    }
  };

  const togglePermission = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== permissionId));
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  const handleToggleStatus = async (subAdmin: User) => {
    if (!confirm(`Are you sure you want to ${subAdmin.is_active ? 'deactivate' : 'activate'} ${subAdmin.name}?`)) {
      return;
    }

    try {
      const updated = await apiClient.toggleSubAdminStatus(subAdmin.id);
      setSubAdmins(subAdmins.map((sa) => (sa.id === updated.id ? updated : sa)));
      setSuccessMessage(`Sub-admin ${updated.is_active ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (subAdmin: User) => {
    if (!confirm(`Are you sure you want to permanently delete ${subAdmin.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteSubAdmin(subAdmin.id);
      setSubAdmins(subAdmins.filter((sa) => sa.id !== subAdmin.id));
      setSuccessMessage("Sub-admin deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sub-admin");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <TableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      {/* Main Content */}
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
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Sub-Admin Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage sub-admin users and their permissions
            </p>
          </div>
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search sub-admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button onClick={openCreateModal} className="flex items-center gap-2">
                <Plus size={20} />
                Create Sub-Admin
              </Button>
            </div>
          </div>

          {/* Sub-Admins Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                  {filteredSubAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCog size={16} className="text-blue-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                            <div className="text-sm text-gray-500">{admin.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            {admin.mobile_number}
                          </div>
                          {admin.email && (
                            <div className="flex items-center">
                              <Mail size={14} className="mr-2 text-gray-400" />
                              {admin.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            admin.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(admin.created_on || "").toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openPermissionsModal(admin)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title="Manage Permissions"
                          >
                            <Shield size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            className={`${
                              admin.is_active ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"
                            } flex items-center gap-1`}
                            title={admin.is_active ? "Deactivate" : "Activate"}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(admin)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSubAdmins.length === 0 && (
                <div className="text-center py-12">
                  <UserCog size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No sub-admins found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Sub-Admin</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as "Male" | "Female" | "Other" })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    minLength={3}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Min 3 characters. Sub-admin will use this to login.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Min 6 characters. Share this securely with the sub-admin.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions * (Select at least one)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start mb-2">
                        <input
                          type="checkbox"
                          id={`perm-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        <label htmlFor={`perm-${permission.id}`} className="ml-3 cursor-pointer">
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                          <div className="text-xs text-gray-500">
                            {permission.resource}:{permission.action}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-gray-400">{permission.description}</div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Create Sub-Admin
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && selectedSubAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Permissions - {selectedSubAdmin.name}</h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Permissions (At least one required)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-start mb-2">
                    <input
                      type="checkbox"
                      id={`modal-perm-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor={`modal-perm-${permission.id}`} className="ml-3 cursor-pointer">
                      <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                      <div className="text-xs text-gray-500">
                        {permission.resource}:{permission.action}
                      </div>
                      {permission.description && (
                        <div className="text-xs text-gray-400">{permission.description}</div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpdatePermissions} className="flex-1">
                Update Permissions
              </Button>
              <Button
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
