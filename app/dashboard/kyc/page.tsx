"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface KYCRecord {
  id: string;
  owner_id: string;
  kyc_status: "pending" | "approved" | "rejected";
  full_name: string;
  mobile_number: string;
  email_id: string;
  company_name: string;
  business_address: string;
  city: string;
  state: string;
  pincode: string;
  pan_number: string;
  gst_number: string | null;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

function KYCManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [filteredKycRecords, setFilteredKycRecords] = useState<KYCRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [pendingKYCCount, setPendingKYCCount] = useState(0);

  // Get filter from URL or default to "all"
  const urlFilter = searchParams?.get('filter');
  const [filterStatus, setFilterStatus] = useState<"all" | "pending">(
    urlFilter === 'pending' ? 'pending' : 'all'
  );
  const [selectedKYC, setSelectedKYC] = useState<KYCRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingKYC, setProcessingKYC] = useState(false);
  const [error, setError] = useState<string>("");

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter === 'pending') {
      setFilterStatus('pending');
    } else {
      setFilterStatus('all');
    }
  }, [urlFilter]);

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
        await fetchKYCRecords();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchKYCRecords = async () => {
    try {
      console.log("Fetching KYC records, filter:", filterStatus);
      const response =
        filterStatus === "pending"
          ? await apiClient.getPendingKYC()
          : await apiClient.getAllKYC();

      console.log("KYC Response:", response);

      if (response && response.data) {
        console.log("KYC Data:", response.data);
        setKycRecords(response.data);
        setTotalRecords(response.total || response.data.length);
      } else {
        console.log("No data in response");
        setKycRecords([]);
        setTotalRecords(0);
      }

      // Also fetch pending count when viewing all records
      if (filterStatus === "all") {
        try {
          const pendingResponse = await apiClient.getPendingKYC(0, 1);
          setPendingKYCCount(pendingResponse.total || 0);
        } catch (err) {
          console.error("Failed to fetch pending KYC count:", err);
        }
      }
    } catch (error) {
      console.error("Failed to fetch KYC records:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch KYC records";
      setError(errorMessage);
      setKycRecords([]);
      setTotalRecords(0);
    }
  };

  useEffect(() => {
    if (user) {
      setError(""); // Clear error when changing filters
      fetchKYCRecords();
    }
  }, [filterStatus, user]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredKycRecords(kycRecords);
    } else {
      const filtered = kycRecords.filter((kyc) =>
        kyc.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kyc.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kyc.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kyc.email_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredKycRecords(filtered);
    }
  }, [searchQuery, kycRecords]);

  const handleViewDetails = (kyc: KYCRecord) => {
    setSelectedKYC(kyc);
    setIsDetailModalOpen(true);
  };

  const handleVerifyClick = (kyc: KYCRecord, action: "approved" | "rejected") => {
    setSelectedKYC(kyc);
    setVerifyAction(action);
    setRejectionReason("");
    setIsDetailModalOpen(false);
    setIsVerifyModalOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedKYC) return;

    if (verifyAction === "rejected" && !rejectionReason.trim()) {
      console.error("Please provide a reason for rejection");
      return;
    }

    setProcessingKYC(true);
    try {
      await apiClient.verifyKYC(
        selectedKYC.id,
        verifyAction,
        verifyAction === "rejected" ? rejectionReason : undefined
      );

      // Refresh the KYC records
      await fetchKYCRecords();

      setIsVerifyModalOpen(false);
      setSelectedKYC(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Failed to verify KYC:", error);
    } finally {
      setProcessingKYC(false);
    }
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
            <div className="mb-8 space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
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
              KYC Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Review and verify partner KYC applications
            </p>
          </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All Records {filterStatus === "all" && `(${totalRecords})`}
            </Button>
            <Button
              variant={filterStatus === "pending" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              Pending {filterStatus === "all" && pendingKYCCount > 0 && `(${pendingKYCCount})`}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by name, company, mobile, or email..."
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

        {/* KYC Records Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company / Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKycRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-center">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-gray-500">
                          {searchQuery
                            ? "No KYC records match your search."
                            : filterStatus === "pending"
                            ? "No pending KYC applications"
                            : "No KYC records found"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredKycRecords.map((kyc) => (
                    <tr key={kyc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {kyc.company_name}
                          </div>
                          <div className="text-sm text-gray-500">{kyc.full_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{kyc.mobile_number}</div>
                        <div className="text-sm text-gray-500">{kyc.email_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            kyc.kyc_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : kyc.kyc_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {kyc.kyc_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(kyc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(kyc)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* KYC Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="KYC Details"
        size="lg"
      >
        {selectedKYC && (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <span
                className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${
                  selectedKYC.kyc_status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : selectedKYC.kyc_status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedKYC.kyc_status.toUpperCase()}
              </span>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-sm text-gray-900">{selectedKYC.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mobile</label>
                  <p className="text-sm text-gray-900">{selectedKYC.mobile_number}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm text-gray-900">{selectedKYC.email_id}</p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Business Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Company Name</label>
                  <p className="text-sm text-gray-900">{selectedKYC.company_name}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-sm text-gray-900">{selectedKYC.business_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">City</label>
                  <p className="text-sm text-gray-900">{selectedKYC.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">State</label>
                  <p className="text-sm text-gray-900">{selectedKYC.state}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Pincode</label>
                  <p className="text-sm text-gray-900">{selectedKYC.pincode}</p>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Tax Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">PAN Number</label>
                  <p className="text-sm text-gray-900">{selectedKYC.pan_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">GST Number</label>
                  <p className="text-sm text-gray-900">
                    {selectedKYC.gst_number || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bank Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Number</label>
                  <p className="text-sm text-gray-900">{selectedKYC.account_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Bank Name</label>
                  <p className="text-sm text-gray-900">{selectedKYC.bank_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                  <p className="text-sm text-gray-900">{selectedKYC.ifsc_code}</p>
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {selectedKYC.kyc_status === "rejected" && selectedKYC.rejected_reason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-red-800">Rejection Reason</label>
                <p className="text-sm text-red-700 mt-1">{selectedKYC.rejected_reason}</p>
              </div>
            )}

            {/* Action Buttons */}
            {selectedKYC.kyc_status === "pending" && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleVerifyClick(selectedKYC, "approved")}
                >
                  Approve KYC
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => handleVerifyClick(selectedKYC, "rejected")}
                >
                  Reject KYC
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Verify Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={`${verifyAction === "approved" ? "Approve" : "Reject"} KYC`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to {verifyAction === "approved" ? "approve" : "reject"}{" "}
            the KYC for <strong>{selectedKYC?.company_name}</strong>?
          </p>

          {verifyAction === "rejected" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsVerifyModalOpen(false)}
              disabled={processingKYC}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className={`flex-1 ${
                verifyAction === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              onClick={handleVerifySubmit}
              disabled={processingKYC}
            >
              {processingKYC
                ? "Processing..."
                : verifyAction === "approved"
                ? "Approve"
                : "Reject"}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}

export default function KYCManagement() {
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
      <KYCManagementContent />
    </Suspense>
  );
}
