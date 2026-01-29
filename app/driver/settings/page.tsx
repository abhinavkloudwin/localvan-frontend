"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import {
  Menu,
  User as UserIcon,
  Shield,
  Info,
  Phone,
  Mail,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import Sidebar from "@/components/driver/Sidebar";
import { ConfirmLogoutModal } from "@/components/ui/ConfirmLogoutModal";

export default function DriverSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const APP_VERSION = "1.0.0";
  const APP_NAME = "LocalVan Driver Panel";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();

        if (!userData || userData.role !== "driver") {
          router.push("/");
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
                  <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Menu size={24} />
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Driver</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View your account details and application information.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-6 h-6 text-white" />
                  <h2 className="text-lg font-semibold text-white">My Profile</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {user.name?.charAt(0).toUpperCase() || "D"}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Driver
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-gray-500">Mobile Number</p>
                      <p className="text-sm font-medium text-gray-900">{user.mobile_number}</p>
                    </div>
                  </div>

                  {user.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-gray-500">Email Address</p>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-gray-500">Account Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.created_on
                          ? new Date(user.created_on).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`}></div>
                    <div>
                      <p className="text-xs text-gray-500">Account Status</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Info className="w-6 h-6 text-white" />
                  <h2 className="text-lg font-semibold text-white">Application Info</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <SettingsIcon className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-xs text-gray-500">Application Name</p>
                      <p className="text-sm font-medium text-gray-900">{APP_NAME}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Info className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-xs text-gray-500">Version</p>
                      <p className="text-sm font-medium text-gray-900">v{APP_VERSION}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className="text-teal-600">🌐</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Environment</p>
                      <p className="text-sm font-medium text-gray-900">
                        {process.env.NODE_ENV === "production" ? "Production" : "Development"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className="text-teal-600">📅</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    © {new Date().getFullYear()} LocalVan. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-6">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </main>
      </div>

      <ConfirmLogoutModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />
    </div>
  );
}
