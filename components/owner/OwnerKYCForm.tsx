"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface OwnerKYCFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OwnerKYCForm({ onSuccess, onCancel }: OwnerKYCFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.submitOwnerKYC(formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
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
                required
                placeholder="Enter your full name"
              />
              <Input
                label="Mobile Number"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                required
                placeholder="+919876543210"
              />
              <Input
                label="Email ID"
                name="email_id"
                type="email"
                value={formData.email_id}
                onChange={handleChange}
                required
                placeholder="your@email.com"
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
                required
                placeholder="Your Company Pvt Ltd"
              />
              <Input
                label="Business Address"
                name="business_address"
                value={formData.business_address}
                onChange={handleChange}
                required
                placeholder="Street, Area"
              />
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Mumbai"
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="Maharashtra"
              />
              <Input
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                placeholder="400001"
                pattern="\d{6}"
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
                required
                placeholder="ABCDE1234F"
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
              />
              <Input
                label="GST Number"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                required
                placeholder="27ABCDE1234F1Z5"
                pattern="\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}"
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
                required
                placeholder="1234567890"
              />
              <Input
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                required
                placeholder="HDFC Bank"
              />
              <Input
                label="IFSC Code"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
                required
                placeholder="HDFC0001234"
                pattern="[A-Z]{4}0[A-Z0-9]{6}"
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
