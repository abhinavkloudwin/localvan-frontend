"use client";

import React, { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { RegisterRequest } from "@/lib/types";

interface RegisterFormProps {
  phoneNumber: string;
  onRegister: (data: RegisterRequest) => Promise<void>;
  whatsappConsent?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  phoneNumber,
  onRegister,
  whatsappConsent = true,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "" as "Male" | "Female" | "Other" | "",
    date_of_birth: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await onRegister({
        phone_number: phoneNumber,
        name: formData.name,
        email: formData.email || undefined,
        gender: formData.gender as "Male" | "Female" | "Other",
        whatsapp_consent: whatsappConsent,
        date_of_birth: formData.date_of_birth || undefined,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ submit: err.message });
      } else {
        setErrors({ submit: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
      <div className="w-full max-w-sm space-y-4">
        <Input
          type="tel"
          label="Mobile Number"
          value={phoneNumber}
          disabled
          className="bg-gray-50"
        />

        <Input
          type="text"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          type="email"
          label="Email (Optional)"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />

        <Input
          type="date"
          label="Date of Birth (Optional)"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="w-full max-w-sm">
        <label className="block text-base font-bold mb-2 text-black">
          Gender
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["Male", "Female", "Other"].map((gender) => (
            <button
              key={gender}
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  gender: gender as "Male" | "Female" | "Other",
                })
              }
              className={`py-2.5 px-4 border rounded-lg font-medium transition-all ${
                formData.gender === gender
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="mt-1.5 text-sm text-red-500">{errors.gender}</p>
        )}
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg w-full max-w-sm">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <Button type="submit" className="w-48" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </Button>
    </form>
  );
};
