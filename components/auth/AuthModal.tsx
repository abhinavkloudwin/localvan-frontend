"use client";

import React, { useState, useEffect } from "react";
import { Tabs } from "../ui/Tabs";
import { PhoneInput } from "./PhoneInput";
import { OTPInput } from "./OTPInput";
import { RegisterForm } from "./RegisterForm";
import { Toast } from "../ui/Toast";
import { apiClient } from "@/lib/api-client";
import type { RegisterRequest } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthStep = "phone" | "otp" | "register";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");
  const [step, setStep] = useState<AuthStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const resetState = () => {
    setStep("phone");
    setPhoneNumber("");
    setIsNewUser(false);
    setError("");
    setShowToast(false);
    setToastMessage("");
    setWhatsappConsent(true);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendOTP = async (phone: string, consent?: boolean) => {
    try {
      if (consent !== undefined) {
        setWhatsappConsent(consent);
      }
      const response = await apiClient.sendOTP({ phone_number: phone });
      // Use the normalized phone number from backend response
      setPhoneNumber(response.phone_number || phone);
      setStep("otp");
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("already exists") || err.message.includes("User already registered")) {
          setError("");
          setActiveTab("login");
        }
        throw err;
      }
      throw new Error("Failed to send OTP");
    }
  };

  const handleLoginSendOTP = async (phone: string) => {
    try {
      const response = await apiClient.sendLoginOTP({ phone_number: phone });
      // Use the normalized phone number from backend response
      setPhoneNumber(response.phone_number || phone);
      setStep("otp");
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("not found") || err.message.includes("User not registered")) {
          setError("");
          setActiveTab("register");
        }
        throw err;
      }
      throw new Error("Failed to send OTP");
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      const response = await apiClient.verifyOTP({
        phone_number: phoneNumber,
        otp,
      });

      // Update phone number with the normalized version from backend
      const normalizedPhone = response.phone_number || phoneNumber;
      setPhoneNumber(normalizedPhone);

      // Check if this is a new user who needs to complete registration
      if (response.requires_registration) {
        setIsNewUser(true);
        setStep("register");
        // DO NOT call onSuccess() here - new users don't have a token yet
      } else {
        // Existing user - OTP verified, but still need to call login to get token
        // For existing users, we need to call the login endpoint to get the token
        try {
          const loginResponse = await apiClient.login({ phone_number: normalizedPhone });
          setToastMessage("Login successful!");
          setShowToast(true);
          onSuccess();
          setTimeout(() => {
            handleClose();
          }, 1500);
        } catch (loginErr) {
          throw loginErr;
        }
      }
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleResendOTP = async () => {
    try {
      await apiClient.resendOTP({ phone_number: phoneNumber });
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleChangeDetails = () => {
    setStep("phone");
    setError("");
  };

  const handleRegister = async (data: RegisterRequest) => {
    try {
      await apiClient.register(data);
      // Now the user has completed registration and has a token
      setToastMessage("Registration successful!");
      setShowToast(true);
      onSuccess();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      throw err;
    }
  };

  const registerContent = (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {step === "phone" && (
        <PhoneInput onSubmit={handleSendOTP} buttonText="Send OTP" showWhatsAppConsent initialPhoneNumber={phoneNumber} />
      )}
      {step === "otp" && (
        <OTPInput
          phoneNumber={phoneNumber}
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
          onChangeDetails={handleChangeDetails}
        />
      )}
      {step === "register" && (
        <RegisterForm phoneNumber={phoneNumber} onRegister={handleRegister} whatsappConsent={whatsappConsent} />
      )}
    </div>
  );

  const loginContent = (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {step === "phone" && (
        <PhoneInput onSubmit={handleLoginSendOTP} buttonText="Send OTP" initialPhoneNumber={phoneNumber} />
      )}
      {step === "otp" && (
        <OTPInput
          phoneNumber={phoneNumber}
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
          onChangeDetails={handleChangeDetails}
        />
      )}
    </div>
  );

  return (
    <>
      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-white/20"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-lg">
            <button
              onClick={handleClose}
              className="absolute -top-8 -right-2 sm:-top-8 sm:-right-4 z-50 p-1.5 rounded-full bg-white hover:bg-gray-50 shadow-md hover:shadow-lg transition-all group border border-gray-200"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-800"
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
            </button>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-y-auto" style={{ maxHeight: '98vh' }}>
              <div className="p-6">
                <Tabs
                  tabs={[
                    { id: "register", label: "Register", content: registerContent },
                    { id: "login", label: "Login", content: loginContent },
                  ]}
                  defaultTab={activeTab}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
