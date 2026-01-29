"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/lib/api-client";
import { logout, checkAdminRole } from "@/lib/auth";
import type { User, OwnerKYCWithAudit, AuditLogEntry } from "@/lib/types";
import { Menu, Plus, History, Edit, Eye, Trash2 } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { OwnerKYCForm } from "@/components/admin/OwnerKYCForm";
import toast from "react-hot-toast";

function OwnerKYCManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [kycRecords, setKycRecords] = useState<OwnerKYCWithAudit[]>([]);
  const [filteredKycRecords, setFilteredKycRecords] = useState<OwnerKYCWithAudit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [error, setError] = useState<string>("");

  // Modal states
  const [selectedKYC, setSelectedKYC] = useState<OwnerKYCWithAudit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [editingKYC, setEditingKYC] = useState<OwnerKYCWithAudit | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Verify action states
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingKYC, setProcessingKYC] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingKYC, setDeletingKYC] = useState(false);

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
      const status = filterStatus === "all" ? undefined : filterStatus;
      const response = await apiClient.getAdminOwnerKYC(0, 100, status, searchQuery || undefined);

      if (response && response.data) {
        setKycRecords(response.data);
        setTotalRecords(response.total || response.data.length);
      } else {
        setKycRecords([]);
        setTotalRecords(0);
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
      setError("");
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

  const handleViewDetails = (kyc: OwnerKYCWithAudit) => {
    setSelectedKYC(kyc);
    setIsDetailModalOpen(true);
  };

  const handleEditKYC = (kyc: OwnerKYCWithAudit) => {
    setEditingKYC(kyc);
    setIsFormModalOpen(true);
  };

  const handleCreateKYC = () => {
    setEditingKYC(null);
    setIsFormModalOpen(true);
  };

  const handleViewAuditHistory = async (kyc: OwnerKYCWithAudit) => {
    setSelectedKYC(kyc);
    setLoadingAudit(true);
    setIsAuditModalOpen(true);

    try {
      const response = await apiClient.getOwnerKYCAuditHistory(kyc.id);
      setAuditHistory(response.data || []);
    } catch (error) {
      console.error("Failed to fetch audit history:", error);
      setAuditHistory([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleVerifyClick = (kyc: OwnerKYCWithAudit, action: "approved" | "rejected") => {
    setSelectedKYC(kyc);
    setVerifyAction(action);
    setRejectionReason("");
    setIsDetailModalOpen(false);
    setIsVerifyModalOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedKYC) return;

    if (verifyAction === "rejected" && !rejectionReason.trim()) {
      return;
    }

    setProcessingKYC(true);
    try {
      await apiClient.verifyAdminOwnerKYC(selectedKYC.id, {
        status: verifyAction,
        rejected_reason: verifyAction === "rejected" ? rejectionReason : undefined,
      });

      await fetchKYCRecords();
      setIsVerifyModalOpen(false);
      setSelectedKYC(null);
      setRejectionReason("");
      toast.success(`KYC ${verifyAction === "approved" ? "approved" : "rejected"} successfully`);
    } catch (error) {
      console.error("Failed to verify KYC:", error);
      toast.error("Failed to verify KYC");
    } finally {
      setProcessingKYC(false);
    }
  };

  const handleDeleteClick = (kyc: OwnerKYCWithAudit) => {
    setSelectedKYC(kyc);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedKYC) return;

    setDeletingKYC(true);
    try {
      await apiClient.deleteAdminOwnerKYC(selectedKYC.id);
      await fetchKYCRecords();
      setIsDeleteModalOpen(false);
      setSelectedKYC(null);
      toast.success("KYC record deleted successfully");
    } catch (error) {
      console.error("Failed to delete KYC:", error);
      toast.error("Failed to delete KYC record");
    } finally {
      setDeletingKYC(false);
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
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Owner KYC Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Create and manage owner KYC records with full audit trail
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleCreateKYC}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Create KYC
            </Button>
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
                All ({totalRecords})
              </Button>
              <Button
                variant={filterStatus === "pending" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "approved" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("approved")}
              >
                Approved
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("rejected")}
              >
                Rejected
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
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKycRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
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
                            {searchQuery ? "No KYC records match your search." : "No KYC records found"}
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
                              {kyc.company_name || "-"}
                            </div>
                            <div className="text-sm text-gray-500">{kyc.full_name || "-"}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{kyc.mobile_number || "-"}</div>
                          <div className="text-sm text-gray-500">{kyc.email_id || "-"}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{kyc.created_by_name || "System"}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(kyc.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{kyc.updated_by_name || "-"}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(kyc.updated_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(kyc)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditKYC(kyc)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit KYC"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleViewAuditHistory(kyc)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View Audit History"
                            >
                              <History size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(kyc)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete KYC"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* KYC Form Modal */}
        <OwnerKYCForm
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingKYC(null);
          }}
          onSuccess={fetchKYCRecords}
          editingKYC={editingKYC}
        />

        {/* KYC Details Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="KYC Details"
          size="lg"
        >
          {selectedKYC && (
            <div className="space-y-6">
              {/* Status Badge & Audit Info */}
              <div className="flex justify-between items-start">
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
                <div className="text-right text-sm text-gray-500">
                  <div>Created by: {selectedKYC.created_by_name || "System"}</div>
                  <div>Updated by: {selectedKYC.updated_by_name || "-"}</div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedKYC.full_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mobile</label>
                    <p className="text-sm text-gray-900">{selectedKYC.mobile_number || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{selectedKYC.email_id || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    <p className="text-sm text-gray-900">{selectedKYC.company_name || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-sm text-gray-900">{selectedKYC.business_address || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">City</label>
                    <p className="text-sm text-gray-900">{selectedKYC.city || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">State</label>
                    <p className="text-sm text-gray-900">{selectedKYC.state || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pincode</label>
                    <p className="text-sm text-gray-900">{selectedKYC.pincode || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">PAN Number</label>
                    <p className="text-sm text-gray-900">{selectedKYC.pan_number || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">GST Number</label>
                    <p className="text-sm text-gray-900">{selectedKYC.gst_number || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Account Number</label>
                    <p className="text-sm text-gray-900">{selectedKYC.account_number || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bank Name</label>
                    <p className="text-sm text-gray-900">{selectedKYC.bank_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                    <p className="text-sm text-gray-900">{selectedKYC.ifsc_code || "-"}</p>
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
              the KYC for <strong>{selectedKYC?.company_name || selectedKYC?.full_name}</strong>?
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
                disabled={processingKYC || (verifyAction === "rejected" && !rejectionReason.trim())}
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

        {/* Audit History Modal */}
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Audit History"
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

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete KYC Record"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the KYC record for{" "}
              <strong>{selectedKYC?.company_name || selectedKYC?.full_name || "this owner"}</strong>?
            </p>
            <p className="text-sm text-red-600">
              This action cannot be undone.
            </p>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deletingKYC}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteSubmit}
                disabled={deletingKYC}
              >
                {deletingKYC ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default function OwnerKYCManagement() {
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
      <OwnerKYCManagementContent />
    </Suspense>
  );
}
