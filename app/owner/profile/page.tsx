"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu, Edit, Mail, Phone, Calendar, UserCircle, Briefcase, Building2, MapPin, CreditCard, Landmark, FileCheck, AlertCircle } from "lucide-react";
import Sidebar from "@/components/owner/Sidebar";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui";
import { useOwnerKYC } from "@/contexts/OwnerKYCContext";

interface KYCData {
  id: string;
  owner_id: string;
  kyc_status: "pending" | "approved" | "rejected";
  full_name?: string | null;
  mobile_number: string;
  email_id?: string | null;
  company_name?: string | null;
  business_address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
  account_number?: string | null;
  bank_name?: string | null;
  ifsc_code?: string | null;
  rejected_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export default function OwnerProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [kycFormData, setKycFormData] = useState<Partial<KYCData>>({});
  const [savingKyc, setSavingKyc] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [imageError, setImageError] = useState(false);
  const { refetchKYC } = useOwnerKYC();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          router.push("/");
          return;
        }

        const userData = await apiClient.getProfile();

        // Check if user is an owner
        if (!userData || userData.role !== "owner") {
          router.push("/");
          return;
        }

        setUser(userData);

        // Fetch KYC data for main owners
        if (!userData.is_owner_sub_user) {
          try {
            const response = await apiClient.getMyKYC();
            if (response && response.data) {
              setKycData(response.data);
              setKycFormData(response.data);
            }
          } catch (err) {
            console.error("Failed to fetch KYC:", err);
          }
        }
      } catch (error) {
        console.error("Failed to check auth:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleKycInputChange = (field: string, value: string) => {
    setKycFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveKyc = async () => {
    if (!kycData) return;

    setSavingKyc(true);
    try {
      await apiClient.updateOwnerKYC(kycFormData);
      // Refetch KYC data locally
      const response = await apiClient.getMyKYC();
      if (response && response.data) {
        setKycData(response.data);
        setKycFormData(response.data);
      }
      // Also update the global context
      await refetchKYC();
      setIsEditingKyc(false);
      showToast("KYC details updated successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to update KYC details", "error");
    } finally {
      setSavingKyc(false);
    }
  };

  const isKycEditable = kycData && kycData.kyc_status !== "approved";

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const getMaskedAccountNumber = (accountNumber?: string | null) => {
    if (!accountNumber) {
      return "Not provided";
    }
    if (accountNumber.length <= 4) {
      return accountNumber;
    }
    const visiblePart = accountNumber.slice(-4);
    const maskedPart = "•".repeat(Math.max(0, accountNumber.length - 4));
    return `${maskedPart}${visiblePart}`;
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 overflow-hidden">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        user={user}
        isUserLoading={loading}
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
                  <p className="text-sm font-medium text-gray-900">{user?.name || "Partner"}</p>
                  <p className="text-xs text-gray-500">Partner</p>
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
              <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600"></div>

              {/* Profile Info Section */}
              <div className="relative px-6 pb-6">
                {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-6">
                  <div className="relative">
                    {user?.profile_image_url && !imageError ? (
                      <img
                        src={user.profile_image_url}
                        alt={user.name || "Profile"}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-xl">
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
                      {user?.name || "Owner"}
                    </h2>
                    <p className="text-gray-600 capitalize mt-1">
                      {user?.role || "Owner"}
                      {user?.is_owner_sub_user && user?.owner_sub_role && (
                        <span className="ml-2 text-purple-600 font-medium">
                          ({user.owner_sub_role})
                        </span>
                      )}
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
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Mail className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Email</p>
                        <p className="text-gray-900 break-all">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Phone className="text-purple-600" size={24} />
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
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserCircle className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Gender</p>
                        <p className="text-gray-900 capitalize">{user.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Account Type */}
                  {user?.is_owner_sub_user !== undefined && (
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Briefcase className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Account Type</p>
                        <p className="text-gray-900">
                          {user.is_owner_sub_user ? (
                            <>
                              Sub User
                              {user.owner_sub_role && (
                                <span className="ml-2 text-purple-600 font-medium capitalize">
                                  ({user.owner_sub_role})
                                </span>
                              )}
                            </>
                          ) : (
                            "Primary Owner"
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Member Since */}
                  {user?.created_on && (
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="text-purple-600" size={24} />
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

            {/* KYC Details Section - Only for main owners */}
            {!user?.is_owner_sub_user && kycData && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="text-purple-600" size={24} />
                    <h3 className="text-lg font-semibold text-gray-900">KYC Details</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        kycData.kyc_status === "approved"
                          ? "bg-green-100 text-green-700"
                          : kycData.kyc_status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {kycData.kyc_status.charAt(0).toUpperCase() + kycData.kyc_status.slice(1)}
                    </span>
                  </div>
                  {isKycEditable && !isEditingKyc && (
                    <Button
                      onClick={() => setIsEditingKyc(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit KYC
                    </Button>
                  )}
                  {isEditingKyc && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveKyc}
                        disabled={savingKyc}
                        className="flex items-center gap-2"
                      >
                        {savingKyc ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingKyc(false);
                          setKycFormData(kycData);
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* Rejected Reason Banner */}
                {kycData.kyc_status === "rejected" && kycData.rejected_reason && (
                  <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                      <p className="text-sm text-red-700">{kycData.rejected_reason}</p>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Personal Information */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Full Name</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.full_name || ""}
                            onChange={(e) => handleKycInputChange("full_name", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.full_name}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Mobile Number</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.mobile_number || ""}
                            onChange={(e) => handleKycInputChange("mobile_number", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.mobile_number}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        {isEditingKyc ? (
                          <Input
                            type="email"
                            value={kycFormData.email_id || ""}
                            onChange={(e) => handleKycInputChange("email_id", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.email_id}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 size={16} />
                      Business Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Company Name</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.company_name || ""}
                            onChange={(e) => handleKycInputChange("company_name", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.company_name}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Business Address</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.business_address || ""}
                            onChange={(e) => handleKycInputChange("business_address", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.business_address}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">City</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.city || ""}
                            onChange={(e) => handleKycInputChange("city", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.city}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">State</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.state || ""}
                            onChange={(e) => handleKycInputChange("state", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.state}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Pincode</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.pincode || ""}
                            onChange={(e) => handleKycInputChange("pincode", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.pincode}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <CreditCard size={16} />
                      Tax Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">PAN Number</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.pan_number || ""}
                            onChange={(e) => handleKycInputChange("pan_number", e.target.value.toUpperCase())}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.pan_number}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">GST Number (Optional)</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.gst_number || ""}
                            onChange={(e) => handleKycInputChange("gst_number", e.target.value.toUpperCase())}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.gst_number || "Not provided"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Landmark size={16} />
                      Bank Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.bank_name || ""}
                            onChange={(e) => handleKycInputChange("bank_name", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.bank_name}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Account Number</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.account_number || ""}
                            onChange={(e) => handleKycInputChange("account_number", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{getMaskedAccountNumber(kycData.account_number)}</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">IFSC Code</p>
                        {isEditingKyc ? (
                          <Input
                            value={kycFormData.ifsc_code || ""}
                            onChange={(e) => handleKycInputChange("ifsc_code", e.target.value.toUpperCase())}
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{kycData.ifsc_code}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
