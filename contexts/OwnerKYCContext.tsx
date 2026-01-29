"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

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

interface OwnerKYCContextType {
  kycData: KYCData | null;
  kycStatus: "pending" | "approved" | "rejected" | null;
  isLoading: boolean;
  error: string | null;
  refetchKYC: () => Promise<void>;
}

const OwnerKYCContext = createContext<OwnerKYCContextType | undefined>(undefined);

export function OwnerKYCProvider({ children }: { children: React.ReactNode }) {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKYC = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated and is an owner
      const token = apiClient.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await apiClient.getProfile();

      // Only fetch KYC for main owners (not sub-users)
      if (userData?.role === "owner" && !userData.is_owner_sub_user) {
        try {
          const response = await apiClient.getMyKYC();
          if (response && response.data) {
            setKycData(response.data);
          }
        } catch (err) {
          // KYC not found is not an error for display
          console.error("Failed to fetch KYC:", err);
        }
      } else if (userData?.is_owner_sub_user) {
        // Sub-users are considered as having approved KYC
        setKycData({ kyc_status: "approved" } as KYCData);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setError("Failed to load KYC data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKYC();
  }, [fetchKYC]);

  const value: OwnerKYCContextType = {
    kycData,
    kycStatus: kycData?.kyc_status || null,
    isLoading,
    error,
    refetchKYC: fetchKYC,
  };

  return (
    <OwnerKYCContext.Provider value={value}>
      {children}
    </OwnerKYCContext.Provider>
  );
}

export function useOwnerKYC() {
  const context = useContext(OwnerKYCContext);
  if (context === undefined) {
    throw new Error("useOwnerKYC must be used within an OwnerKYCProvider");
  }
  return context;
}
