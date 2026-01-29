"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { AuthModal } from "@/components/auth/AuthModal";
import OwnerKYCForm from "@/components/owner/OwnerKYCForm";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/types";

interface BecomePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate?: () => void;
}

type PartnerFlow = "auth" | "upgrade" | "kyc" | "kycStatus" | "success";

interface KYCData {
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

export default function BecomePartnerModal({ isOpen, onClose, onUserUpdate }: BecomePartnerModalProps) {
  const router = useRouter();
  const [currentFlow, setCurrentFlow] = useState<PartnerFlow>("auth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [userData, setUserData] = useState<User | null>(null);

  const resetModalState = useCallback(() => {
    setCurrentFlow("auth");
    setError(null);
    setKycData(null);
    setUserData(null);
  }, []);

  const handleClose = useCallback(() => {
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);

  const closeAndGoToDashboard = useCallback(() => {
    resetModalState();
    onClose();
    router.push("/owner/dashboard");
  }, [onClose, resetModalState, router]);

  // Check if user is already authenticated and has KYC
  useEffect(() => {
    const checkAuthAndKYC = async () => {
      if (isOpen) {
        const token = apiClient.getToken();
        if (token) {
          setIsAuthenticated(true);

          // Fetch user profile for pre-populating KYC form
          try {
            const userProfile = await apiClient.getProfile();
            setUserData(userProfile);
          } catch (err) {
            console.log("Failed to fetch user profile:", err);
          }

          // Try to fetch user's KYC status
          try {
            const response = await apiClient.getMyKYC();
            console.log("KYC Response:", response);

            // The response structure is { success: true, message: "...", data: {...} }
            if (response && response.data) {
              console.log("KYC Data:", response.data);
              setKycData(response.data);

              if (response.data.kyc_status === "pending") {
                closeAndGoToDashboard();
                return;
              }

              setCurrentFlow("kycStatus");
            } else {
              console.log("No KYC data found, showing KYC form");
              setCurrentFlow("kyc");
            }
          } catch (err) {
            // User doesn't have KYC yet, go directly to KYC form
            console.log("KYC fetch error:", err);
            setCurrentFlow("kyc");
          }
        } else {
          setIsAuthenticated(false);
          setCurrentFlow("auth");
        }
      }
    };

    checkAuthAndKYC();
  }, [isOpen, closeAndGoToDashboard]);

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    // Notify parent that user has logged in
    onUserUpdate?.();

    // Fetch user profile for pre-populating KYC form
    try {
      const userProfile = await apiClient.getProfile();
      setUserData(userProfile);
    } catch (err) {
      console.log("Failed to fetch user profile:", err);
    }

    // Go directly to KYC form (user role will be converted to owner on KYC submit)
    setCurrentFlow("kyc");
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.becomePartner();
      console.log("Successfully upgraded to partner:", result.message);
      // Notify parent that user has been upgraded
      onUserUpdate?.();
      setCurrentFlow("kyc");
    } catch (err) {
      if (err instanceof Error && err.message.includes("already a partner")) {
        // User is already a partner, skip to KYC
        setCurrentFlow("kyc");
      } else {
        setError(err instanceof Error ? err.message : "Failed to upgrade to partner");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKYCSuccess = async () => {
    // Notify parent that user data has changed (role upgraded to owner)
    onUserUpdate?.();

    // Fetch the newly created KYC to show status
    try {
      const response = await apiClient.getMyKYC();
      if (response.data) {
        setKycData(response.data);

        if (response.data.kyc_status === "pending") {
          closeAndGoToDashboard();
          return;
        }

        setCurrentFlow("kycStatus");
      } else {
        setCurrentFlow("success");
      }
    } catch (err) {
      // If fetch fails, just show success message
      setCurrentFlow("success");
    }
  };


  const renderContent = () => {
    switch (currentFlow) {
      case "auth":
        return (
          <div>
            <AuthModal
              isOpen={true}
              onClose={handleClose}
              onSuccess={handleAuthSuccess}
            />
          </div>
        );

      case "upgrade":
        return (
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Partner</h2>
              <p className="text-gray-600">
                You're one step away from becoming a partner! Click below to upgrade your account
                and start managing your vehicles.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? "Upgrading..." : "Upgrade to Partner"}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case "kyc":
        return (
          <div>
            <OwnerKYCForm
              onSuccess={handleKYCSuccess}
              onCancel={handleClose}
              user={userData}
            />
          </div>
        );

      case "kycStatus":
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              {kycData?.kyc_status === "pending" && (
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
              {kycData?.kyc_status === "approved" && (
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
              {kycData?.kyc_status === "rejected" && (
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {kycData?.kyc_status === "pending" && "KYC Under Review"}
                {kycData?.kyc_status === "approved" && "KYC Approved!"}
                {kycData?.kyc_status === "rejected" && "KYC Rejected"}
              </h2>

              <p className="text-gray-600 mb-4">
                {kycData?.kyc_status === "pending" &&
                  "Your KYC application is currently being reviewed by our team. We'll notify you once it's processed."}
                {kycData?.kyc_status === "approved" &&
                  "Congratulations! Your KYC has been approved. You can now add vehicles and start earning."}
                {kycData?.kyc_status === "rejected" &&
                  `Unfortunately, your KYC application was rejected. ${kycData.rejected_reason || "Please contact support for more information."}`}
              </p>
            </div>

            {/* KYC Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    kycData?.kyc_status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : kycData?.kyc_status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {kycData?.kyc_status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Full Name:</span>
                <span className="text-sm text-gray-900">{kycData?.full_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Company:</span>
                <span className="text-sm text-gray-900">{kycData?.company_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Submitted:</span>
                <span className="text-sm text-gray-900">
                  {kycData?.created_at
                    ? new Date(kycData.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {kycData?.kyc_status === "approved" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    handleClose();
                    router.push("/owner/dashboard");
                  }}
                >
                  Manage Vehicles
                </Button>
              )}
              {kycData?.kyc_status === "rejected" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    // Allow user to submit KYC again
                    setKycData(null);
                    setCurrentFlow("kyc");
                  }}
                >
                  Submit New KYC
                </Button>
              )}
              <Button
                variant={kycData?.kyc_status === "approved" || kycData?.kyc_status === "rejected" ? "outline" : "primary"}
                className="w-full"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your KYC has been submitted successfully. Our team will review it and notify you
                once it's approved. You'll be able to add vehicles and start earning once your KYC
                is verified.
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleClose}
            >
              Got it!
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={currentFlow === "kyc" ? "xl" : "md"}
    >
      {renderContent()}
    </Modal>
  );
}
