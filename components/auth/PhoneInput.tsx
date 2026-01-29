"use client";

import React, { useState, useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface PhoneInputProps {
  onSubmit: (phoneNumber: string, whatsappConsent?: boolean) => Promise<void>;
  buttonText?: string;
  showWhatsAppConsent?: boolean;
  initialPhoneNumber?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  onSubmit,
  buttonText = "Continue",
  showWhatsAppConsent = false,
  initialPhoneNumber = "",
}) => {
  // Extract just the 10-digit number from E.164 format (+91XXXXXXXXXX)
  const extractLocalNumber = (phone: string): string => {
    if (!phone) return "";
    // Remove +91 prefix if present
    const cleaned = phone.replace(/^\+91/, "");
    // Return only digits, max 10
    return cleaned.replace(/\D/g, "").slice(0, 10);
  };

  const [phoneNumber, setPhoneNumber] = useState(extractLocalNumber(initialPhoneNumber));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  // Update phone number when initialPhoneNumber prop changes
  useEffect(() => {
    const extracted = extractLocalNumber(initialPhoneNumber);
    if (extracted) {
      setPhoneNumber(extracted);
    }
  }, [initialPhoneNumber]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit(phoneNumber, showWhatsAppConsent ? whatsappConsent : undefined);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
      <div className="w-full max-w-sm">
        <Input
          type="tel"
          label="Enter Mobile Number"
          placeholder="Enter 10-digit number"
          value={phoneNumber}
          onChange={handlePhoneChange}
          error={error}
          prefix={
            <span className="text-lg">🇮🇳</span>
          }
          maxLength={10}
        />
      </div>
      {showWhatsAppConsent && (
        <div className="w-full max-w-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
            />
            <span className="text-xs text-gray-600 leading-tight">
              I agree to receive booking updates, notifications, and promotional messages on WhatsApp
            </span>
          </label>
        </div>
      )}
      <Button
        type="submit"
        className="w-48"
        disabled={phoneNumber.length !== 10 || loading || (showWhatsAppConsent && !whatsappConsent)}
      >
        {loading ? "Please wait..." : buttonText}
      </Button>
    </form>
  );
};
