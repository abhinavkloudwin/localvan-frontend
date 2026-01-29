"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { OwnerKYCPayload, User } from "@/lib/types";

interface OwnerKYCFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  user?: User | null;
}

type OwnerKYCPayloadKeys = keyof OwnerKYCPayload;
type OwnerKYCFormData = Record<OwnerKYCPayloadKeys, string>;

const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const PINCODE_REGEX = /^\d{6}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_MIN_LENGTH = 9;

const REQUIRED_FIELDS: Array<{ name: OwnerKYCPayloadKeys; label: string }> = [
  { name: "mobile_number", label: "Mobile Number" },
];

const UPPERCASE_FIELDS: OwnerKYCPayloadKeys[] = [
  "pan_number",
  "gst_number",
  "ifsc_code",
];

const NO_WHITESPACE_FIELDS: OwnerKYCPayloadKeys[] = [
  "mobile_number",
  "pincode",
  "pan_number",
  "gst_number",
  "account_number",
  "ifsc_code",
];

const INITIAL_FORM_STATE: OwnerKYCFormData = {
  full_name: "",
  mobile_number: "",
  email_id: "",
  company_name: "",
  business_address: "",
  city: "",
  state: "",
  pincode: "",
  pan_number: "",
  gst_number: "",
  account_number: "",
  bank_name: "",
  ifsc_code: "",
};

export default function OwnerKYCForm({ onSuccess, onCancel, user }: OwnerKYCFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OwnerKYCFormData>(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<OwnerKYCPayloadKeys, string>>
  >({});

  // Pre-populate form with user profile data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.name || "",
        mobile_number: user.mobile_number || "",
        email_id: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as OwnerKYCPayloadKeys;
    let sanitizedValue = value;

    if (NO_WHITESPACE_FIELDS.includes(fieldName)) {
      sanitizedValue = sanitizedValue.replace(/\s+/g, "");
    }
    if (UPPERCASE_FIELDS.includes(fieldName)) {
      sanitizedValue = sanitizedValue.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [fieldName]: sanitizedValue }));
    if (formErrors[fieldName]) {
      setFormErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.submitOwnerKYC(buildPayload());
      if (onSuccess) {
        onSuccess();
      }
      // Navigate to owner dashboard after successful submission
      router.push("/owner/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<OwnerKYCPayloadKeys, string>> = {};

    REQUIRED_FIELDS.forEach(({ name, label }) => {
      if (!formData[name]?.trim()) {
        errors[name] = `${label} is required`;
      }
    });

    const mobile = formData.mobile_number.trim();
    if (mobile && !PHONE_REGEX.test(mobile)) {
      errors.mobile_number = "Enter a valid mobile number with country code";
    }

    const email = formData.email_id.trim();
    if (email && !EMAIL_REGEX.test(email)) {
      errors.email_id = "Enter a valid email address";
    }

    const pincode = formData.pincode.trim();
    if (pincode && !PINCODE_REGEX.test(pincode)) {
      errors.pincode = "Pincode must be exactly 6 digits";
    }

    const pan = formData.pan_number.trim();
    if (pan && !PAN_REGEX.test(pan)) {
      errors.pan_number = "PAN must follow the format ABCDE1234F";
    }

    const gst = formData.gst_number.trim();
    if (gst && !GST_REGEX.test(gst)) {
      errors.gst_number = "GST number must follow the format 27ABCDE1234F1Z5";
    }

    const accountNumber = formData.account_number.trim();
    if (accountNumber && accountNumber.length < ACCOUNT_MIN_LENGTH) {
      errors.account_number = "Account number must be at least 9 digits";
    }

    const ifsc = formData.ifsc_code.trim();
    if (ifsc && !IFSC_REGEX.test(ifsc)) {
      errors.ifsc_code = "Enter a valid IFSC code (e.g. HDFC0001234)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = (): OwnerKYCPayload => {
    const payload: OwnerKYCPayload = {};
    (Object.keys(formData) as OwnerKYCPayloadKeys[]).forEach((key) => {
      const value = formData[key].trim();
      if (value) {
        payload[key] = value;
      }
    });
    return payload;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner KYC Form</h2>
        <p className="text-gray-600 mb-6">
          Please fill in your business details to complete the KYC verification process.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                error={formErrors.full_name}
              />
              <Input
                label="Mobile Number"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                placeholder="+919876543210"
                error={formErrors.mobile_number}
              />
              <Input
                label="Email ID"
                name="email_id"
                type="email"
                value={formData.email_id}
                onChange={handleChange}
                placeholder="your@email.com"
                error={formErrors.email_id}
              />
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Your Company Pvt Ltd"
                error={formErrors.company_name}
              />
              <Input
                label="Business Address"
                name="business_address"
                value={formData.business_address}
                onChange={handleChange}
                placeholder="Street, Area"
                error={formErrors.business_address}
              />
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
                error={formErrors.city}
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Maharashtra"
                error={formErrors.state}
              />
              <Input
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="400001"
                error={formErrors.pincode}
              />
            </div>
          </div>

          {/* Tax Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="PAN Number"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                error={formErrors.pan_number}
              />
              <Input
                label="GST Number (Optional)"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="27ABCDE1234F1Z5"
                error={formErrors.gst_number}
              />
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Number"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                placeholder="1234567890"
                error={formErrors.account_number}
              />
              <Input
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="HDFC Bank"
                error={formErrors.bank_name}
              />
              <Input
                label="IFSC Code"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
                placeholder="HDFC0001234"
                error={formErrors.ifsc_code}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit KYC"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-500 text-center mt-4">
            Your KYC will be reviewed by our team. You'll be notified once it's approved.
          </p>
        </form>
      </div>
    </div>
  );
}
