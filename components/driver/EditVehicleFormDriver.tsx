"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api-client";

interface EditVehicleFormDriverProps {
  vehicle: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  latitude: string;
  longitude: string;
  radius: string;
  is_active: boolean;
}

export default function EditVehicleFormDriver({
  vehicle,
  onSuccess,
  onCancel,
}: EditVehicleFormDriverProps) {
  const [formData, setFormData] = useState<FormData>({
    latitude: vehicle.latitude?.toString() || "",
    longitude: vehicle.longitude?.toString() || "",
    radius: vehicle.radius?.toString() || "10.0",
    is_active: vehicle.is_active ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vehicleImages, setVehicleImages] = useState<File[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const vehicleImagesInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const showToastMessage = (message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleImageClick = (imageUrl: string, images: string[], index: number) => {
    setSelectedImage(imageUrl);
    setAllImages(images);
    setCurrentImageIndex(index);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
    setAllImages([]);
    setCurrentImageIndex(0);
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setSelectedImage(allImages[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setSelectedImage(allImages[currentImageIndex + 1]);
    }
  };

  // Touch swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePreviousImage();
    }
  };

  // Keyboard navigation for image modal
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePreviousImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        handleCloseImageModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, currentImageIndex, allImages]);

  const handleVehicleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 5;

    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      showToastMessage("Please upload only JPG or PNG images under 5MB", "error");
      if (vehicleImagesInputRef.current) {
        vehicleImagesInputRef.current.value = "";
      }
      return;
    }

    if (files.length > maxFiles) {
      showToastMessage(`You can only upload up to ${maxFiles} images`, "error");
      if (vehicleImagesInputRef.current) {
        vehicleImagesInputRef.current.value = "";
      }
      return;
    }

    setVehicleImages(files);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.latitude && (parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }

    if (formData.longitude && (parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180)) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    if (formData.radius && parseFloat(formData.radius) < 0) {
      newErrors.radius = "Radius must be positive";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToastMessage("Please fix the errors in the form", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {};

      if (formData.latitude) updateData.latitude = parseFloat(formData.latitude);
      if (formData.longitude) updateData.longitude = parseFloat(formData.longitude);
      if (formData.radius) updateData.radius = parseFloat(formData.radius);
      updateData.is_active = formData.is_active;

      await apiClient.updateVehicle(vehicle.id, updateData);

      if (vehicleImages.length > 0) {
        await apiClient.updateVehicleImages(vehicle.id, vehicleImages);
      }

      showToastMessage("Vehicle updated successfully!", "success");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      showToastMessage(error.message || "Failed to update vehicle", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        {/* Read-only fields */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-gray-700 mb-2">Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Vehicle Type</label>
              <p className="mt-1 text-gray-900">{vehicle.vehicle_type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Model</label>
              <p className="mt-1 text-gray-900">{vehicle.model}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Fuel Type</label>
              <p className="mt-1 text-gray-900">{vehicle.fuel_type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">RC Book Number</label>
              <p className="mt-1 text-gray-900">{vehicle.rc_book_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Driving License Number</label>
              <p className="mt-1 text-gray-900">{vehicle.driving_license_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Booking Amount</label>
              <p className="mt-1 text-gray-900">₹{vehicle.booking_amount}</p>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              error={errors.latitude}
              placeholder="Enter latitude"
            />
          </div>

          <div>
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              error={errors.longitude}
              placeholder="Enter longitude"
            />
          </div>

          <div>
            <Input
              label="Service Radius (km)"
              type="number"
              step="0.1"
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
              error={errors.radius}
              placeholder="Enter radius"
            />
          </div>
        </div>

        {/* Vehicle Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Vehicle is active and available for bookings
          </label>
        </div>

        {/* Vehicle Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Images <span className="text-gray-500 text-xs">- Add up to 5 more images</span>
          </label>
          <div className="space-y-3">
            {/* Existing vehicle images */}
            {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">Current images ({vehicle.vehicle_images.length}):</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {vehicle.vehicle_images.map((imageUrl: string, idx: number) => (
                    <img
                      key={idx}
                      src={imageUrl}
                      alt={`Vehicle ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleImageClick(imageUrl, vehicle.vehicle_images, idx)}
                    />
                  ))}
                </div>
              </div>
            )}
            <input
              ref={vehicleImagesInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              onChange={handleVehicleImagesChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500">
              New images will be added to existing ones. Supported: JPG, PNG (max 5MB each, up to 5 images)
            </p>
            {vehicleImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {vehicleImages.map((file, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-lg border-2 border-blue-300"
                    />
                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      New
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Vehicle"}
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

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleCloseImageModal}
        >
          <div className="relative w-full max-w-7xl flex items-center justify-center gap-4">
            {/* Close button */}
            <button
              onClick={handleCloseImageModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left Navigation button */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousImage();
                }}
                disabled={currentImageIndex === 0}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Image Container */}
            <div
              className="relative flex-1 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={selectedImage}
                alt="Vehicle"
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />

              {/* Image counter */}
              {allImages.length > 1 && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white text-sm">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
            </div>

            {/* Right Navigation button */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                disabled={currentImageIndex === allImages.length - 1}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
