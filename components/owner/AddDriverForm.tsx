"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import Tesseract from "tesseract.js";
import { Toast } from "../ui";

interface AddDriverFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddDriverForm: React.FC<AddDriverFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    driving_license_number: "",
    license_expire_date: "",
    license_types: [] as string[],
    date_of_birth: "",
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [driverPhotoFile, setDriverPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);
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

  const extractLicenseNumber = (text: string): string | null => {
    // Driving License number patterns in India:
    // Format: DL-SSYYNNNNNNN or SSYYNNNNNNN or SS-YYNNNNNNN
    // Example: DL-1420110012345, MH0120110012345, KA-0320150012345
    // SS = State Code (2 letters/digits), YY = RTO Code (2 digits), YYYY = Year (4 digits), NNNNNNN = Serial (7 digits)

    console.log("Full extracted text:", text);

    // More aggressive OCR mistake corrections
    const correctOCRMistakes = (str: string): string => {
      let corrected = str;

      // Common OCR mistakes with letters and numbers
      corrected = corrected.replace(/O(?=\d)/gi, '0');
      corrected = corrected.replace(/(?<=\d)O(?=\d)/gi, '0');
      corrected = corrected.replace(/(?<=\d)O/gi, '0');

      corrected = corrected.replace(/I(?=\d)/gi, '1');
      corrected = corrected.replace(/(?<=\d)I(?=\d)/gi, '1');
      corrected = corrected.replace(/(?<=\d)I/gi, '1');

      corrected = corrected.replace(/(?<=\d)S(?=\d)/gi, '5');
      corrected = corrected.replace(/(?<=\d)B(?=\d)/gi, '8');
      corrected = corrected.replace(/(?<=\d)Z(?=\d)/gi, '2');
      corrected = corrected.replace(/(?<=\d)G(?=\d)/gi, '6');

      // Common letter confusions
      corrected = corrected.replace(/R5/gi, 'RS');
      corrected = corrected.replace(/H[I1]/gi, 'H');

      return corrected;
    };

    // Clean up the text - remove excessive whitespace and special chars
    const cleanText = text.replace(/[^\w\s\-]/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Cleaned text:", cleanText);

    // Keywords to look for in driving license
    const keywords = [
      "DL NO",
      "DLNO",
      "DL NUMBER",
      "DLNUMBER",
      "DL. NO",
      "LICENCE NO",
      "LICENSE NO",
      "LICENCE NUMBER",
      "LICENSE NUMBER",
      "DRIVING LICENCE NO",
      "DRIVING LICENSE NO",
      "DRIVING LICENCE NUMBER",
      "DRIVING LICENSE NUMBER",
      "L.NO",
      "LIC NO",
      "LNO",
      "Date of first Issue", // Often appears near DL number
      "DOI", // Date of Issue
    ];

    // First try to find number near keywords
    const upperText = cleanText.toUpperCase();
    for (const keyword of keywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Get text after the keyword (next 300 characters)
        let textAfterKeyword = cleanText.substring(
          keywordIndex,
          keywordIndex + 300
        );
        console.log(`Found keyword "${keyword}", checking nearby text:`, textAfterKeyword);

        // Apply OCR corrections
        textAfterKeyword = correctOCRMistakes(textAfterKeyword);
        console.log("After OCR corrections:", textAfterKeyword);

        // Look for sequences that could be DL numbers
        // More flexible patterns to catch garbled text
        const patterns = [
          // Standard formats
          /[A-Z]{2}[\s-]?\d{2}[\s-]?\d{4}[\s-]?\d{7}/i,
          /[A-Z]{2}\d{14}/i,
          /[A-Z]{2}[\s-]?\d{13,15}/i,
          // Look for any 13-15 digit sequence potentially with state code
          /[A-Z]{2}[0-9]{13,15}/i,
          // More relaxed: 2 letters followed by lots of numbers
          /[A-Z]{2}[0-9\s-]{13,20}/i,
        ];

        for (const pattern of patterns) {
          const match = textAfterKeyword.match(pattern);
          if (match) {
            let licenseNumber = match[0].replace(/[\s-]/g, "").toUpperCase();
            // Ensure it's at least 15 characters (2 letter + 13 digits)
            if (licenseNumber.length >= 15) {
              console.log("Found license number near keyword:", licenseNumber);
              return licenseNumber;
            }
          }
        }
      }
    }

    // If not found near keywords, try to extract any potential DL number from full text
    console.log("Keyword search failed, searching entire text...");

    // Apply OCR corrections to full text
    const correctedFullText = correctOCRMistakes(cleanText);

    // Look for sequences that match DL pattern - any 2 letters followed by numbers
    const words = correctedFullText.split(/\s+/);
    for (const word of words) {
      // Check if word starts with 2 letters and has lots of numbers
      if (/^[A-Z]{2}[0-9]{13,15}$/i.test(word)) {
        console.log("Found potential license number:", word);
        return word.toUpperCase();
      }
    }

    // Last resort: look for any long number sequence that could be a DL
    const numberSequence = correctedFullText.match(/[A-Z]{2}[0-9\s-]{13,20}/gi);
    if (numberSequence && numberSequence.length > 0) {
      const cleaned = numberSequence[0].replace(/[\s-]/g, "").toUpperCase();
      if (cleaned.length >= 15) {
        console.log("Found number sequence that could be license:", cleaned);
        return cleaned;
      }
    }

    console.log("No license number found in text");
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      console.error("Please upload a valid image (JPG, PNG) or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error("File size should not exceed 10MB");
      return;
    }

    setLicenseFile(file);

    // Clear file error
    if (errors.license_file) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.license_file;
        return newErrors;
      });
    }

    // Start OCR extraction
    setIsExtractingOCR(true);

    try {
      console.log("Starting OCR extraction for:", file.name);

      let extractedText = "";

      // Try first configuration
      console.log("Attempting OCR with standard config...");
      const result1 = await Tesseract.recognize(file, "eng", ({
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/ ',
      } as any));

      extractedText = result1.data.text;
      console.log("Extracted text (attempt 1):", extractedText);

      // Try to extract license number
      let licenseNumber = extractLicenseNumber(extractedText);

      // If first attempt fails and image quality seems poor, try alternative config
      if (!licenseNumber && extractedText.length < 50) {
        console.log("First attempt yielded poor results, trying alternative config...");
        const result2 = await Tesseract.recognize(file, "eng", ({
          logger: (m: any) => {
            if (m.status === "recognizing text") {
              console.log(`OCR Progress (attempt 2): ${Math.round(m.progress * 100)}%`);
            }
          },
        } as any));

        const altText = result2.data.text;
        console.log("Extracted text (attempt 2):", altText);

        licenseNumber = extractLicenseNumber(altText);
      }

      if (licenseNumber) {
        console.log("License Number found:", licenseNumber);
        setFormData((prev) => ({ ...prev, driving_license_number: licenseNumber }));
      } else {
        console.log("No license number found in the document");
        console.log("Suggestion: Try uploading a clearer image or enter the number manually");
      }
    } catch (error) {
      console.error("OCR extraction failed:", error);
    } finally{
      setIsExtractingOCR(false);
    }
  };

  const handleDriverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image (JPG, PNG)", "error");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast("Image size should not exceed 5MB", "error");
      return;
    }

    setDriverPhotoFile(file);

    // Clear error
    if (errors.driver_photo) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.driver_photo;
        return newErrors;
      });
    }
  };

  const handleSendOTP = async () => {
    if (!formData.mobile_number || formData.mobile_number.length < 10) {
      setErrors((prev) => ({ ...prev, mobile_number: "Please enter a valid mobile number" }));
      return;
    }

    setIsSendingOTP(true);
    try {
      await apiClient.sendDriverOTP(formData.mobile_number);
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
      await apiClient.verifyDriverOTP(formData.mobile_number, otp);
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
    if (!formData.driving_license_number.trim()) {
      newErrors.driving_license_number = "Driving license number is required";
    }
    if (!licenseFile) {
      newErrors.license_file = "Please upload driving license file";
    }
    if (!formData.license_types || formData.license_types.length === 0) {
      newErrors.license_types = "At least one license type is required";
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
      // Create FormData
      const data = new FormData();
      data.append("name", formData.name);
      if (formData.email.trim()) {
        data.append("email", formData.email);
      }
      data.append("mobile_number", formData.mobile_number);
      data.append("driving_license_number", formData.driving_license_number);
      data.append("driving_license_file", licenseFile!);

      // Add driver photo if provided
      if (driverPhotoFile) {
        data.append("driver_photo", driverPhotoFile);
      }

      // Add license expire date if provided
      if (formData.license_expire_date) {
        data.append("license_expire_date", new Date(formData.license_expire_date).toISOString());
      }

      // Add license types (as comma-separated string)
      if (formData.license_types && formData.license_types.length > 0) {
        data.append("license_types", formData.license_types.join(","));
      }

      // Add date of birth if provided
      if (formData.date_of_birth) {
        data.append("date_of_birth", new Date(formData.date_of_birth).toISOString());
      }

      // Submit
      await apiClient.addDriver(data);

      // Reset form
      setFormData({
        name: "",
        email: "",
        mobile_number: "",
        driving_license_number: "",
        license_expire_date: "",
        license_types: [],
        date_of_birth: "",
      });
      setLicenseFile(null);
      setDriverPhotoFile(null);
      setOtpVerified(false);
      setOtpSent(false);
      setOtp("");

      showToast("Driver added successfully!", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to add driver. Please try again.", "error");
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
            placeholder="Enter driver's full name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            error={errors.name}
          />
        </div>

        {/* Email (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address (Optional)
          </label>
          <Input
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
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
          <div>
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
                className="flex-1"
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

        {/* Driving License Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Driving License Number <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Auto-filled after upload or enter manually"
            value={formData.driving_license_number}
            onChange={(e) =>
              handleInputChange("driving_license_number", e.target.value)
            }
            error={errors.driving_license_number}
          />
          {!formData.driving_license_number && !licenseFile && (
            <p className="mt-1 text-xs text-gray-500">
              💡 Upload license file to auto-extract the number
            </p>
          )}
        </div>

        {/* License Expire Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            License Expiry Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.license_expire_date}
            onChange={(e) => handleInputChange("license_expire_date", e.target.value)}
            error={errors.license_expire_date}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* License Types - Multi Select */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            License Type <span className="text-red-500">*</span>
          </label>
          <div className={`p-3 border rounded-lg ${errors.license_types ? "border-red-500" : "border-gray-300"}`}>
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
                    if (errors.license_types) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.license_types;
                        return newErrors;
                      });
                    }
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
                    if (errors.license_types) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.license_types;
                        return newErrors;
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">HMV (Heavy Motor Vehicle)</span>
              </label>
            </div>
          </div>
          {errors.license_types && (
            <p className="mt-1 text-sm text-red-500">{errors.license_types}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth (Optional)
          </label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Driver Photo Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Driver Photo (Optional)
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleDriverPhotoChange}
            className="hidden"
            id="driver-photo-upload"
          />
          <label
            htmlFor="driver-photo-upload"
            className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-all ${
              errors.driver_photo
                ? "border-red-500 bg-red-50 cursor-pointer"
                : "border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
            }`}
          >
            <div className="text-center">
              {driverPhotoFile ? (
                <div className="flex items-center gap-2">
                  <img
                    src={URL.createObjectURL(driverPhotoFile)}
                    alt="Driver preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-600">
                      {driverPhotoFile.name}
                    </p>
                    <p className="text-xs text-gray-500">Click to change</p>
                  </div>
                </div>
              ) : (
                <>
                  <svg
                    className={`mx-auto h-12 w-12 ${
                      errors.driver_photo ? "text-red-400" : "text-gray-400"
                    }`}
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">
                      Click to upload driver photo
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </>
              )}
            </div>
          </label>
          {errors.driver_photo && (
            <p className="mt-1.5 text-sm text-red-500">{errors.driver_photo}</p>
          )}
        </div>
      </div>

      {/* License File Upload - Full Width */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Upload Driving License <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="license-file-upload"
            disabled={isExtractingOCR}
          />
          <label
            htmlFor="license-file-upload"
            className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-all ${
              isExtractingOCR
                ? "border-blue-500 bg-blue-50 cursor-wait"
                : errors.license_file
                ? "border-red-500 bg-red-50 cursor-pointer"
                : "border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
            }`}
          >
            <div className="text-center">
              {isExtractingOCR ? (
                <>
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-3 text-sm font-medium text-blue-600">
                    Extracting license number...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This may take a few seconds
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className={`mx-auto h-12 w-12 ${
                      errors.license_file ? "text-red-400" : "text-gray-400"
                    }`}
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {licenseFile ? (
                      <span className="font-medium text-blue-600">
                        {licenseFile.name}
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-blue-600">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, PDF up to 10MB
                  </p>
                  {licenseFile && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ License number will be auto-extracted
                    </p>
                  )}
                </>
              )}
            </div>
          </label>
          {errors.license_file && (
            <p className="mt-1.5 text-sm text-red-500">{errors.license_file}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isExtractingOCR || !otpVerified}
          className="flex-1"
        >
          {isSubmitting
            ? "Adding Driver..."
            : isExtractingOCR
            ? "Extracting license number..."
            : "Add Driver"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isExtractingOCR}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
    </>
  );
};
