"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { Toast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api-client";
import {
  FUEL_TYPES,
  DRIVING_MODES,
  VEHICLE_FEATURES,
} from "@/lib/vehicle-constants";
import type { VehicleCategory, VehicleType } from "@/lib/types";
import { useLoadScript, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";

interface EditVehicleFormProps {
  vehicle: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  vehicle_category_id: string;
  vehicle_type_id: string;
  is_ac: boolean;
  vehicle_name: string;
  features: string[];
  fuel_type: string;
  latitude: string;
  longitude: string;
  radius: string;
  driving_mode: string;
  is_active: boolean;
}

interface DriverSummary {
  id: string;
  name: string;
  mobile_number: string;
  is_active: boolean;
}

const libraries: ("places" | "geometry")[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

export default function EditVehicleForm({ vehicle, onSuccess, onCancel }: EditVehicleFormProps) {
  // Parse features if they exist
  const parseFeatures = (features: string | null): string[] => {
    if (!features) return [];
    if (typeof features === "string") {
      return features.split(",").map((f) => f.trim());
    }
    return [];
  };

  const [formData, setFormData] = useState<FormData>({
    vehicle_category_id: "",
    vehicle_type_id: vehicle.vehicle_type_id || "",
    is_ac: vehicle.is_ac ?? true,
    vehicle_name: vehicle.vehicle_name || "",
    features: parseFeatures(vehicle.features),
    fuel_type: vehicle.fuel_type || "",
    latitude: vehicle.latitude?.toString() || "",
    longitude: vehicle.longitude?.toString() || "",
    radius: vehicle.radius?.toString() || "10.0",
    driving_mode: vehicle.driving_mode || "",
    is_active: vehicle.is_active ?? true,
  });
  const [selectedDriverId, setSelectedDriverId] = useState<string>(vehicle.driver_id || "");
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [filteredVehicleTypes, setFilteredVehicleTypes] = useState<VehicleType[]>([]);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(false);

  const initialPosition = {
    lat: vehicle.latitude || defaultCenter.lat,
    lng: vehicle.longitude || defaultCenter.lng,
  };

  const [mapCenter, setMapCenter] = useState(initialPosition);
  const [markerPosition, setMarkerPosition] = useState(initialPosition);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
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

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Fetch vehicle categories and vehicle types on component mount
  useEffect(() => {
    const fetchVehicleCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await apiClient.listVehicleCategories(true);
        if (response && response.data) {
          setVehicleCategories(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch vehicle categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchVehicleTypes = async () => {
      setLoadingVehicleTypes(true);
      try {
        const response = await apiClient.listVehicleTypes(undefined, true);
        if (response && response.data) {
          setVehicleTypes(response.data);

          // If vehicle has vehicle_type_id, find its category
          if (vehicle.vehicle_type_id && response.data.length > 0) {
            const vehicleType = response.data.find((vt: VehicleType) => vt.id === vehicle.vehicle_type_id);
            if (vehicleType) {
              setFormData(prev => ({ ...prev, vehicle_category_id: vehicleType.vehicle_category_id }));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch vehicle types:", error);
      } finally {
        setLoadingVehicleTypes(false);
      }
    };

    fetchVehicleCategories();
    fetchVehicleTypes();
  }, [vehicle.vehicle_type_id]);

  useEffect(() => {
    const fetchDrivers = async () => {
      setDriversLoading(true);
      try {
        const response = await apiClient.getMyDrivers();
        if (response) {
          setDrivers(response.data || response || []);
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      } finally {
        setDriversLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  // Filter vehicle types based on selected category
  useEffect(() => {
    if (formData.vehicle_category_id) {
      const filtered = vehicleTypes.filter(
        (vt) => vt.vehicle_category_id === formData.vehicle_category_id
      );
      setFilteredVehicleTypes(filtered);
    } else {
      setFilteredVehicleTypes([]);
    }
  }, [formData.vehicle_category_id, vehicleTypes]);

  useEffect(() => {
    setSelectedDriverId(vehicle.driver_id || "");
  }, [vehicle.driver_id]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => {
      const features = prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature];
      return { ...prev, features };
    });
  };

  const handleVehicleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const invalidFiles = files.filter((file) => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      showToastMessage("Please upload only JPG or PNG images", "error");
      return;
    }

    // Validate file sizes (max 5MB per image)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      showToastMessage("Each image should not exceed 5MB", "error");
      return;
    }

    // Limit to 5 images
    if (files.length > 5) {
      showToastMessage("You can upload maximum 5 images", "error");
      return;
    }

    setVehicleImages(files);
  };

  const handleRemoveVehicleImage = (index: number) => {
    setVehicleImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
        setFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));
        setLocationSearchQuery(place.formatted_address || "");
      }
    }
  };

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPosition({ lat, lng });
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setLocationSearchQuery(results[0].formatted_address);
        }
      });
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicle_category_id) newErrors.vehicle_category_id = "Vehicle category is required";
    if (!formData.vehicle_type_id) newErrors.vehicle_type_id = "Vehicle type is required";
    if (!formData.fuel_type) newErrors.fuel_type = "Fuel type is required";
    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Please select a location on the map";
    }
    if (!formData.driving_mode) newErrors.driving_mode = "Driving mode is required";

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
      // Update basic vehicle details using FormData to match the new API
      // Only send fields that should be editable (exclude read-only fields like registration_date, rc_book_number, driving_license_number)
      const submitFormData = new FormData();
      submitFormData.append("vehicle_type_id", formData.vehicle_type_id);
      submitFormData.append("is_ac", formData.is_ac.toString());
      if (formData.vehicle_name) {
        submitFormData.append("vehicle_name", formData.vehicle_name);
      }
      if (formData.features.length > 0) {
        submitFormData.append("features", formData.features.join(", "));
      }
      submitFormData.append("fuel_type", formData.fuel_type);
      submitFormData.append("latitude", formData.latitude);
      submitFormData.append("longitude", formData.longitude);
      submitFormData.append("radius", formData.radius);
      submitFormData.append("driving_mode", formData.driving_mode);
      submitFormData.append("is_active", formData.is_active.toString());
      submitFormData.append("driver_id", selectedDriverId);

      await apiClient.updateVehicle(vehicle.id, submitFormData);

      // Update vehicle images if new images were uploaded
      if (vehicleImages.length > 0) {
        await apiClient.updateVehicleImages(vehicle.id, vehicleImages);
      }

      showToastMessage("Vehicle updated successfully!", "success");

      // Close modal after a short delay to show the success message
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Failed to update vehicle:", error);
      showToastMessage(
        error instanceof Error ? error.message : "Failed to update vehicle. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) {
    return <div className="text-red-600">Failed to load Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="text-gray-600">Loading Google Maps...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Vehicle Category <span className="text-red-500">*</span>
          </label>
          <CustomDropdown
            options={vehicleCategories.map((cat) => ({
              value: cat.id,
              label: cat.category_name,
            }))}
            value={formData.vehicle_category_id}
            onChange={(value) => handleInputChange("vehicle_category_id", value)}
            placeholder={loadingCategories ? "Loading categories..." : "Choose vehicle category"}
            error={errors.vehicle_category_id}
          />
        </div>

        {/* Vehicle Type (Model Type) */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Vehicle Type <span className="text-red-500">*</span>
          </label>
          <CustomDropdown
            options={filteredVehicleTypes.map((vt) => ({
              value: vt.id,
              label: `${vt.model_type} (${vt.seats} seats)`,
            }))}
            value={formData.vehicle_type_id}
            onChange={(value) => handleInputChange("vehicle_type_id", value)}
            placeholder={
              !formData.vehicle_category_id
                ? "Select category first"
                : loadingVehicleTypes
                ? "Loading..."
                : "Choose vehicle type"
            }
            error={errors.vehicle_type_id}
          />
        </div>

        {/* Vehicle Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Vehicle Name
          </label>
          <Input
            type="text"
            placeholder="e.g., My Blue Honda"
            value={formData.vehicle_name}
            onChange={(e) => handleInputChange("vehicle_name", e.target.value)}
            error={errors.vehicle_name}
          />
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Fuel Type <span className="text-red-500">*</span>
          </label>
          <CustomDropdown
            options={FUEL_TYPES}
            value={formData.fuel_type}
            onChange={(value) => handleInputChange("fuel_type", value)}
            placeholder="Choose fuel type"
            error={errors.fuel_type}
          />
        </div>

        {/* Driving Mode */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Driving Mode <span className="text-red-500">*</span>
          </label>
          <CustomDropdown
            options={DRIVING_MODES}
            value={formData.driving_mode}
            onChange={(value) => handleInputChange("driving_mode", value)}
            placeholder="Choose driving mode"
            error={errors.driving_mode}
          />
        </div>

        {/* Assigned Driver */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Assigned Driver
          </label>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            disabled={driversLoading || drivers.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">No driver assigned</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} {driver.is_active ? "" : "(Inactive)"}
              </option>
            ))}
          </select>
          {driversLoading ? (
            <p className="text-xs text-gray-500 mt-1">Loading drivers...</p>
          ) : drivers.length === 0 ? (
            <p className="text-xs text-red-500 mt-1">
              No drivers available. Add a driver from the Drivers tab.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Select a driver to assign to this vehicle.
            </p>
          )}
        </div>

        {/* Air Conditioning */}
        <div className="flex items-center space-x-3 pt-7">
          <input
            type="checkbox"
            id="is_ac"
            checked={formData.is_ac}
            onChange={(e) => setFormData(prev => ({ ...prev, is_ac: e.target.checked }))}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_ac" className="text-sm font-semibold text-gray-800">
            Air Conditioned (AC)
          </label>
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Radius (km)
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="Enter service radius"
            value={formData.radius}
            onChange={(e) => handleInputChange("radius", e.target.value)}
          />
        </div>
      </div>

      {/* Vehicle Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Features
        </label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VEHICLE_FEATURES.map((feature) => (
              <label
                key={feature.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature.value)}
                  onChange={() => handleFeatureToggle(feature.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{feature.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Location Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Location <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              componentRestrictions: { country: "in" }
            }}
          >
            <input
              type="text"
              placeholder="Search for a location..."
              value={locationSearchQuery}
              onChange={(e) => setLocationSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Autocomplete>
          <p className="text-sm text-gray-500">
            Search for a location or click on the map to update vehicle location
          </p>
          <div className="rounded-lg overflow-hidden border border-gray-300">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
              onClick={handleMapClick}
            >
              <Marker position={markerPosition} />
            </GoogleMap>
          </div>
          {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
        </div>
      </div>

      {/* Vehicle Images Upload */}
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
            className="hidden"
            id="vehicle-images-upload-edit"
          />
          <label
            htmlFor="vehicle-images-upload-edit"
            className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
                <span className="font-semibold text-blue-600">Click to add</span> more images
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 5MB each (Max 5 new images at once)
              </p>
            </div>
          </label>

          {/* Image previews */}
          {vehicleImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {vehicleImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Vehicle ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveVehicleImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Read-only information */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Vehicle Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">RC Book Number:</span>
            <span className="ml-2 font-medium text-gray-900">{vehicle.rc_book_number || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-600">Registration Date:</span>
            <span className="ml-2 font-medium text-gray-900">
              {vehicle.registration_date ? new Date(vehicle.registration_date).toLocaleDateString() : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Driver:</span>
            <span className="ml-2 font-medium text-gray-900">
              {(() => {
                const driver = drivers.find(d => d.id === vehicle.driver_id);
                return driver?.name || "Not assigned";
              })()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 font-medium ${vehicle.is_active ? "text-green-600" : "text-red-600"}`}>
              {vehicle.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Updating Vehicle..." : "Update Vehicle"}
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
