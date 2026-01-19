"use client";

import React, { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface PhoneInputProps {
  onSubmit: (phoneNumber: string) => Promise<void>;
  buttonText?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  onSubmit,
  buttonText = "Continue",
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      await onSubmit(phoneNumber);
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
      <Button
        type="submit"
        className="w-48"
        disabled={phoneNumber.length !== 10 || loading}
      >
        {loading ? "Please wait..." : buttonText}
      </Button>
    </form>
  );
};
