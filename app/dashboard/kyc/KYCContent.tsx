"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Menu } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";

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

export default function KYCContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
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
      setError("Failed to load KYC records. Please try again.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchKYCRecords();
    }
  }, [filterStatus, user]);

  const handleViewDetails = (kyc: KYCRecord) => {
    setSelectedKYC(kyc);
    setIsDetailModalOpen(true);
  };

  const handleApprove = (kyc: KYCRecord) => {
    setSelectedKYC(kyc);
    setVerifyAction("approved");
    setIsVerifyModalOpen(true);
  };

  const handleReject = (kyc: KYCRecord) => {
    setSelectedKYC(kyc);
    setVerifyAction("rejected");
    setRejectionReason("");
    setIsVerifyModalOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedKYC) return;

    if (verifyAction === "rejected" && !rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setProcessingKYC(true);
    setError("");

    try {
      await apiClient.verifyKYC(
        selectedKYC.id,
        verifyAction,
        verifyAction === "rejected" ? rejectionReason : undefined
      );

      // Refresh the KYC list
      await fetchKYCRecords();

      // Close modal
      setIsVerifyModalOpen(false);
      setSelectedKYC(null);
      setRejectionReason("");
    } catch (err: any) {
      console.error("Failed to verify KYC:", err);
      setError(err.message || "Failed to verify KYC. Please try again.");
    } finally {
      setProcessingKYC(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC management...</p>
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

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setFilterStatus("all")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filterStatus === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Records ({totalRecords})
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filterStatus === "pending"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pending ({pendingKYCCount})
              </button>
            </nav>
          </div>
        </div>

        {/* KYC Records Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kycRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-lg font-medium mb-1">No KYC records found</p>
                        <p className="text-sm">
                          {filterStatus === "pending"
                            ? "There are no pending KYC applications"
                            : "No KYC applications have been submitted yet"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  kycRecords.map((kyc) => (
                    <tr key={kyc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {kyc.company_name}
                        </div>
                        <div className="text-sm text-gray-500">{kyc.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{kyc.mobile_number}</div>
                        <div className="text-sm text-gray-500">{kyc.email_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            kyc.kyc_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : kyc.kyc_status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {kyc.kyc_status.charAt(0).toUpperCase() +
                            kyc.kyc_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(kyc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(kyc)}
                        >
                          View
                        </Button>
                        {kyc.kyc_status === "pending" && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(kyc)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(kyc)}
                              className="!text-red-600 !border-red-600 hover:!bg-red-50"
                            >
                              Reject
                            </Button>
                          </>
                        )}
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

      {/* KYC Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="KYC Details"
      >
        {selectedKYC && (
          <div className="space-y-6">
            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Company Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.company_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Business Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.business_address}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    City
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.city}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    State
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.state}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Pincode
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Owner Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.full_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Mobile Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.mobile_number}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Email ID
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.email_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Tax Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    PAN Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.pan_number}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    GST Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.gst_number || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Bank Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Account Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.account_number}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Bank Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.bank_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    IFSC Code
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedKYC.ifsc_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Status Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    KYC Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedKYC.kyc_status === "approved"
                          ? "bg-green-100 text-green-800"
                          : selectedKYC.kyc_status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedKYC.kyc_status.charAt(0).toUpperCase() +
                        selectedKYC.kyc_status.slice(1)}
                    </span>
                  </p>
                </div>
                {selectedKYC.rejected_reason && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">
                      Rejection Reason
                    </label>
                    <p className="mt-1 text-sm text-red-600">
                      {selectedKYC.rejected_reason}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Submitted At
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedKYC.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Last Updated
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedKYC.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedKYC.kyc_status === "pending" && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleReject(selectedKYC);
                  }}
                  className="!text-red-600 !border-red-600 hover:!bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleApprove(selectedKYC);
                  }}
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Verify Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setRejectionReason("");
          setError("");
        }}
        title={verifyAction === "approved" ? "Approve KYC" : "Reject KYC"}
      >
        {selectedKYC && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Company Name:</p>
              <p className="font-semibold text-gray-900">
                {selectedKYC.company_name}
              </p>
              <p className="text-sm text-gray-600 mt-2">Owner Name:</p>
              <p className="font-semibold text-gray-900">
                {selectedKYC.full_name}
              </p>
            </div>

            {verifyAction === "rejected" && (
              <div>
                <label
                  htmlFor="rejection-reason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Rejection Reason *
                </label>
                <textarea
                  id="rejection-reason"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setRejectionReason("");
                  setError("");
                }}
                disabled={processingKYC}
              >
                Cancel
              </Button>
              <Button
                variant={verifyAction === "approved" ? "primary" : "outline"}
                onClick={handleVerifySubmit}
                disabled={processingKYC}
                className={
                  verifyAction === "rejected"
                    ? "!bg-red-600 !text-white hover:!bg-red-700 !border-red-600"
                    : ""
                }
              >
                {processingKYC
                  ? "Processing..."
                  : verifyAction === "approved"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
