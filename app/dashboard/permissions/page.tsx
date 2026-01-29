"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User, Permission, PermissionCreate, PermissionUpdate } from "@/lib/types";
import { Menu, Plus, Pencil, Trash2, Shield, X } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function PermissionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<PermissionCreate>({
    name: "",
    resource: "",
    action: "",
    description: "",
    is_active: true,
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

        // Fetch all permissions
        const permissionsData = await apiClient.getAllPermissions(0, 1000);
        setPermissions(permissionsData);
        setFilteredPermissions(permissionsData);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setError("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPermissions(permissions);
    } else {
      const filtered = permissions.filter(
        (permission) =>
          permission.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          permission.resource?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          permission.action?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPermissions(filtered);
    }
  }, [searchQuery, permissions]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const openCreateModal = () => {
    setEditingPermission(null);
    setFormData({
      name: "",
      resource: "",
      action: "",
      description: "",
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description || "",
      is_active: permission.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (editingPermission) {
        // Update existing permission
        const updated = await apiClient.updatePermission(editingPermission.id, formData);
        setPermissions(permissions.map((p) => (p.id === updated.id ? updated : p)));
        setSuccessMessage("Permission updated successfully");
      } else {
        // Create new permission
        const created = await apiClient.createPermission(formData);
        setPermissions([...permissions, created]);
        setSuccessMessage("Permission created successfully");
      }
      setShowModal(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save permission");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (permissionId: string, permissionName: string) => {
    if (!confirm(`Are you sure you want to delete permission "${permissionName}"?`)) {
      return;
    }

    try {
      await apiClient.deletePermission(permissionId);
      setPermissions(permissions.filter((p) => p.id !== permissionId));
      setSuccessMessage("Permission deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete permission");
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
              Permissions Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create and manage system permissions
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
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button onClick={openCreateModal} className="flex items-center gap-2">
                <Plus size={20} />
                Create Permission
              </Button>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPermissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield size={16} className="text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{permission.resource}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{permission.action}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{permission.description || "-"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            permission.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {permission.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(permission)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(permission.id, permission.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPermissions.length === 0 && (
                <div className="text-center py-12">
                  <Shield size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No permissions found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingPermission ? "Edit Permission" : "Create Permission"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <input
                    type="text"
                    value={formData.resource}
                    onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <input
                    type="text"
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  {editingPermission ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
