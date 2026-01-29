"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { Toast } from "../ui";

interface AddSubUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddSubUserForm: React.FC<AddSubUserFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    gender: "Male",
    username: "",
    password: "",
    owner_sub_role: "manager",
    date_of_birth: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Toast state and helpers
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({ message: "", type: "success", isVisible: false });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // OTP Timer effect
  React.useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleInputChange = (field: string, value: string) => {
    // Clean mobile number - remove spaces and keep only digits
    if (field === "mobile_number") {
      value = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Reset OTP verification if mobile number changes
    if (field === "mobile_number" && otpVerified) {
      setOtpVerified(false);
      setOtpSent(false);
      setOtp("");
    }
  };

  const handleSendOTP = async () => {
    if (!formData.mobile_number || formData.mobile_number.length < 10) {
      setErrors((prev) => ({ ...prev, mobile_number: "Please enter a valid mobile number" }));
      return;
    }

    setIsSendingOTP(true);
    try {
      await apiClient.sendSubUserOTP(formData.mobile_number);
      setOtpSent(true);
      setOtpTimer(60); // 60 seconds countdown
      showToast("OTP sent successfully to " + formData.mobile_number, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    setIsVerifyingOTP(true);
    try {
      await apiClient.verifySubUserOTP(formData.mobile_number, otp);
      setOtpVerified(true);
      showToast("Mobile number verified successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Invalid OTP. Please try again.", "error");
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = "Mobile number is required";
    } else if (formData.mobile_number.length < 10) {
      newErrors.mobile_number = "Mobile number must be at least 10 digits";
    }
    if (!otpVerified) {
      newErrors.otp = "Please verify mobile number with OTP";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.addSubUser(formData);

      // Reset form
      setFormData({
        name: "",
        mobile_number: "",
        email: "",
        gender: "Male",
        username: "",
        password: "",
        owner_sub_role: "manager",
        date_of_birth: "",
      });
      setOtpVerified(false);
      setOtpSent(false);
      setOtp("");

      showToast("Sub-user added successfully!", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to add sub-user. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
        duration={4000}
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={errors.name}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.owner_sub_role}
              onChange={(e) => handleInputChange("owner_sub_role", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
            >
              <option value="admin">Admin - Full access to all features</option>
              <option value="manager">Manager - Manage bookings & vehicles</option>
              <option value="sales">Sales - View & manage bookings</option>
            </select>
          </div>

          {/* Mobile Number with OTP Verification */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobile_number}
                onChange={(e) => handleInputChange("mobile_number", e.target.value)}
                maxLength={15}
                error={errors.mobile_number}
                disabled={otpVerified}
                className="flex-1"
              />
              {!otpVerified && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendOTP}
                  disabled={isSendingOTP || otpTimer > 0 || formData.mobile_number.length < 10}
                  className="whitespace-nowrap"
                >
                  {isSendingOTP
                    ? "Sending..."
                    : otpTimer > 0
                    ? `Resend (${otpTimer}s)`
                    : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
                </Button>
              )}
              {otpVerified && (
                <div className="flex items-center px-3 bg-green-50 text-green-600 rounded-md border border-green-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-sm font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* OTP Input */}
          {otpSent && !otpVerified && (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Enter OTP <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="flex-1 max-w-xs"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleVerifyOTP}
                  disabled={isVerifyingOTP || otp.length !== 6}
                  className="whitespace-nowrap"
                >
                  {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
              {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp}</p>}
            </div>
          )}

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Email Address (Optional)
            </label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Date of Birth (Optional)
            </label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter username for login"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              error={errors.username}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="Enter password (min 6 characters)"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={errors.password}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !otpVerified}
            className="flex-1"
          >
            {isSubmitting ? "Adding Sub-User..." : "Add User"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </>
  );
};
