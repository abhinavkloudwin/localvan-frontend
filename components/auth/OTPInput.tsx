"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/Button";

interface OTPInputProps {
  phoneNumber: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeDetails: () => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  phoneNumber,
  onVerify,
  onResend,
  onChangeDetails,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onVerify(otpString);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      await onResend();
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center">
          Enter the 6-digit OTP sent to {phoneNumber.replace(/^(\+91)(\d+)$/, '$1 $2')}
        </p>
        <div className="flex gap-1.5 sm:gap-2 justify-center">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleVerify}
          className="w-48"
          disabled={otp.join("").length !== 6 || loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </Button>
      </div>

      <div className="text-center space-y-2">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Resend OTP
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend OTP in {timer}s
          </p>
        )}
        <div>
          <button
            onClick={onChangeDetails}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Change Mobile Number
          </button>
        </div>
      </div>
    </div>
  );
};
