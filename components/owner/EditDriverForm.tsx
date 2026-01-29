"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api-client";

interface EditDriverFormProps {
  driver: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  license_expire_date: string;
  license_types: string[];
  date_of_birth: string;
}

export function EditDriverForm({ driver, onSuccess, onCancel }: EditDriverFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: driver.name || "",
    email: driver.email || "",
    license_expire_date: driver.license_expire_date ? new Date(driver.license_expire_date).toISOString().split('T')[0] : "",
    license_types: driver.license_types || [],
    date_of_birth: driver.date_of_birth ? new Date(driver.date_of_birth).toISOString().split('T')[0] : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToastMessage = (message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
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
      const updateData: Record<string, any> = {
        name: formData.name,
        email: formData.email || null,
      };

      // Add optional fields if provided
      if (formData.license_expire_date) {
        updateData.license_expire_date = new Date(formData.license_expire_date).toISOString();
      }
      if (formData.license_types && formData.license_types.length > 0) {
        updateData.license_types = formData.license_types;
      }
      if (formData.date_of_birth) {
        updateData.date_of_birth = new Date(formData.date_of_birth).toISOString();
      }

      await apiClient.updateDriver(driver.id, updateData);
      showToastMessage("Driver updated successfully!", "success");

      // Close modal after a short delay to show the success message
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Failed to update driver:", error);
      showToastMessage(
        error instanceof Error ? error.message : "Failed to update driver. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Read-only information */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Driver Information (Read-only)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Mobile Number:</span>
            <span className="ml-2 font-medium text-gray-900">{driver.mobile_number || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-600">Driving License:</span>
            <span className="ml-2 font-medium text-gray-900">
              {driver.driving_license_number || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 font-medium ${driver.is_active ? "text-green-600" : "text-red-600"}`}>
              {driver.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Enter driver name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            error={errors.name}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <Input
            type="email"
            placeholder="Enter email address (optional)"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={errors.email}
          />
        </div>

        {/* License Expire Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Expiry Date
          </label>
          <Input
            type="date"
            value={formData.license_expire_date}
            onChange={(e) => handleInputChange("license_expire_date", e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* License Types - Multi Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Type
          </label>
          <div className="p-3 border border-gray-300 rounded-lg">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.license_types.includes("LMV")}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...formData.license_types, "LMV"]
                      : formData.license_types.filter((t) => t !== "LMV");
                    setFormData((prev) => ({ ...prev, license_types: newTypes }));
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">LMV (Light Motor Vehicle)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.license_types.includes("HMV")}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...formData.license_types, "HMV"]
                      : formData.license_types.filter((t) => t !== "HMV");
                    setFormData((prev) => ({ ...prev, license_types: newTypes }));
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">HMV (Heavy Motor Vehicle)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Updating Driver..." : "Update Driver"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </form>
  );
}
