"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Toast } from "../ui/Toast";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    gender: (user?.gender as "Male" | "Female" | "Other") || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(user?.profile_image_url || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors({ image: "Please select an image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ image: "Image size must be less than 5MB" });
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, image: "" });

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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

  const handleImageUpload = async () => {
    if (!selectedFile || !user?.id) return;

    setUploadingImage(true);

    try {
      const updatedUser = await apiClient.uploadProfileImage(user.id, selectedFile);
      if (updatedUser) {
        onSuccess(updatedUser);
        setPreviewUrl(updatedUser.profile_image_url || "");
        setSelectedFile(null);
        setErrors({ ...errors, image: "", submit: "" });

        // Close modal after successful upload
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ ...errors, submit: err.message });
      } else {
        setErrors({ ...errors, submit: "Failed to upload image. Please try again." });
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const updatedUser = await apiClient.updateProfile({
        name: formData.name,
        email: formData.email || undefined,
        gender: formData.gender as "Male" | "Female" | "Other",
      });

      if (updatedUser) {
        onSuccess(updatedUser);
        setToastMessage("Profile updated successfully!");
        setShowToast(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ submit: err.message });
      } else {
        setErrors({ submit: "Failed to update profile. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6 flex flex-col items-center px-2 sm:px-0">
        <div className="w-full max-w-sm space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm sm:text-base font-bold mb-1.5 sm:mb-2 text-black text-center">
              Profile Picture
            </label>
            <div className="flex flex-col items-center gap-2 sm:gap-4">
              <div className="relative group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover border-3 sm:border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-xl sm:text-3xl">
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "??"}
                  </div>
                )}
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 w-7 h-7 sm:w-10 sm:h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all group-hover:scale-110"
                  title="Upload new image"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </label>
              </div>
              {selectedFile && (
                <div className="w-full space-y-1.5 sm:space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600 text-center break-all px-2">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full"
                  >
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
              )}
              {errors.image && (
                <p className="text-xs sm:text-sm text-red-500 text-center">{errors.image}</p>
              )}
              <p className="text-xs text-gray-500 text-center px-2">
                Max size: 5MB
              </p>
            </div>
          </div>

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
        </div>

        <div className="w-full max-w-sm">
          <label className="block text-sm sm:text-base font-bold mb-1.5 sm:mb-2 text-black">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                className={`py-1.5 sm:py-2.5 px-2 sm:px-4 border rounded-lg text-sm sm:text-base font-medium transition-all ${
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
            <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-500">{errors.gender}</p>
          )}
        </div>

        <div className="w-full max-w-sm">
          <Input
            type="tel"
            label="Mobile Number"
            value={user?.mobile_number?.replace(/^(\+91)(\d)/, "$1 $2") || ""}
            disabled
            className="bg-gray-50"
          />
        </div>

        {errors.submit && (
          <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg w-full max-w-sm">
            <p className="text-xs sm:text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2 w-full max-w-sm">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-sm sm:text-base py-2"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1 text-sm sm:text-base py-2" disabled={loading}>
            {uploadingImage ? "Uploading..." : loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </Modal>
  );
};
