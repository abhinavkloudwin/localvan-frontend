"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu, Edit, Mail, Phone, Calendar, UserCircle } from "lucide-react";
import Sidebar from "@/components/driver/Sidebar";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { Button } from "@/components/ui/Button";

export default function DriverProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();

        // Check if user is a driver
        if (!userData || userData.role !== "driver") {
          router.push("/");
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error("Failed to check auth:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-hidden">
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
                  <div className="text-right space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="h-64 bg-white/50 rounded-lg animate-pulse"></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-hidden">
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
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.mobile_number}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Cover/Header Section */}
              <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600"></div>

              {/* Profile Info Section */}
              <div className="relative px-6 pb-6">
                {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-6">
                  <div className="relative">
                    {user?.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt={user.name || "Profile"}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-xl">
                        {user?.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "??"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {user?.name || "Driver"}
                    </h2>
                    <p className="text-gray-600 capitalize mt-1">
                      {user?.role || "Driver"}
                    </p>
                  </div>

                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Edit Profile
                  </Button>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Email */}
                  {user?.email && (
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Mail className="text-emerald-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Email</p>
                        <p className="text-gray-900 break-all">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Phone className="text-emerald-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Mobile Number</p>
                      <p className="text-gray-900">
                        {user?.mobile_number?.replace(/^(\+91)(\d)/, "$1 $2") || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Gender */}
                  {user?.gender && (
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <UserCircle className="text-emerald-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Gender</p>
                        <p className="text-gray-900 capitalize">{user.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Member Since */}
                  {user?.created_on && (
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Calendar className="text-emerald-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Member Since</p>
                        <p className="text-gray-900">
                          {new Date(user.created_on).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onSuccess={handleProfileUpdate}
        />
      )}
    </div>
  );
}
