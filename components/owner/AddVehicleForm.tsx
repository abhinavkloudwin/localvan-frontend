"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { apiClient } from "@/lib/api-client";
import Tesseract from "tesseract.js";
import {
  FUEL_TYPES,
  DRIVING_MODES,
  VEHICLE_FEATURES,
} from "@/lib/vehicle-constants";
import type { VehicleCategory, VehicleType } from "@/lib/types";
import { useLoadScript, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";

interface AddVehicleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Driver {
  id: string;
  name: string;
  mobile_number: string;
  email: string | null;
  driving_license_number: string | null;
}

interface FormData {
  vehicle_category_id: string;
  vehicle_type_id: string;
  vehicle_name: string;
  features: string[];
  fuel_type: string;
  registration_date: string;
  is_ac: boolean;
  latitude: string;
  longitude: string;
  radius: string;
  driving_mode: string;
  driver_id: string;
  rc_book_number: string;
  rc_book_file: File | null;
}

const libraries: ("places" | "geometry")[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 12.9716, // Bangalore coordinates as default
  lng: 77.5946,
};

export default function AddVehicleForm({ onSuccess, onCancel }: AddVehicleFormProps) {
  const [formData, setFormData] = useState<FormData>({
    vehicle_category_id: "",
    vehicle_type_id: "",
    vehicle_name: "",
    features: [],
    fuel_type: "",
    registration_date: "",
    is_ac: true,
    latitude: "",
    longitude: "",
    radius: "10.0",
    driving_mode: "",
    driver_id: "",
    rc_book_number: "",
    rc_book_file: null,
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [filteredVehicleTypes, setFilteredVehicleTypes] = useState<VehicleType[]>([]);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vehicleImagesInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Fetch drivers, vehicle categories, and vehicle types on component mount
  useEffect(() => {
    const fetchDrivers = async () => {
      setLoadingDrivers(true);
      try {
        const response = await apiClient.getMyDrivers();
        if (response && response.data) {
          setDrivers(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      } finally {
        setLoadingDrivers(false);
      }
    };

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
        }
      } catch (error) {
        console.error("Failed to fetch vehicle types:", error);
      } finally {
        setLoadingVehicleTypes(false);
      }
    };

    fetchDrivers();
    fetchVehicleCategories();
    fetchVehicleTypes();
  }, []);

  // Filter vehicle types based on selected category
  useEffect(() => {
    if (formData.vehicle_category_id) {
      const filtered = vehicleTypes.filter(
        (vt) => vt.vehicle_category_id === formData.vehicle_category_id
      );
      setFilteredVehicleTypes(filtered);
      // Reset vehicle type selection if current selection is not in filtered list
      if (formData.vehicle_type_id && !filtered.find(vt => vt.id === formData.vehicle_type_id)) {
        setFormData(prev => ({ ...prev, vehicle_type_id: "" }));
      }
    } else {
      setFilteredVehicleTypes([]);
      setFormData(prev => ({ ...prev, vehicle_type_id: "" }));
    }
  }, [formData.vehicle_category_id, vehicleTypes]);

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

  const handleDriverChange = (driverId: string) => {
    // Find the selected driver to get their license number
    const selectedDriver = drivers.find((driver) => driver.id === driverId);

    // Update form with driver_id
    setFormData((prev) => ({ ...prev, driver_id: driverId }));

    // Clear error if exists
    if (errors.driver_id) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.driver_id;
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

  const extractRCNumber = (text: string): string | null => {
    // RC book number patterns in India:
    // Format: XX00XX0000 or XX00XX000000
    // Example: DL01AB1234, KA05MN123456, MH02CD5678, AN01J8844

    console.log("Full extracted text:", text);

    // Fix common OCR mistakes
    const correctOCRMistakes = (str: string): string => {
      let corrected = str;
      // Replace O with 0 when surrounded by digits or at start of digit sequence
      corrected = corrected.replace(/([A-Z]{2})O(\d)/gi, '$10$2'); // e.g., ANO1 -> AN01
      corrected = corrected.replace(/([A-Z]{2}\d)O([A-Z])/gi, '$10$2'); // e.g., AN0OJ -> AN00J
      corrected = corrected.replace(/([A-Z])O(\d{3,})/gi, '$10$2'); // e.g., JO8844 -> J08844
      // Replace I with 1 when in digit context
      corrected = corrected.replace(/(\d)I(\d)/gi, '$11$2');
      return corrected;
    };

    // Keywords to look for in RC book
    const keywords = [
      "REG. NO",
      "REG NO",
      "REGN NO",
      "REGISTRATION NO",
      "REGISTRATION NUMBER",
      "CHASIS NUMBER",
      "CHASSIS NUMBER",
      "CHASIS NO",
      "CHASSIS NO",
      "VEHICLE NUMBER",
      "VEHICLE NO",
      "ENGINE NUMBER",
      "ENGINE NO",
      "REGISTRATION MARK",
    ];

    // First try to find number near keywords
    const upperText = text.toUpperCase();
    for (const keyword of keywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Get text after the keyword (next 150 characters)
        let textAfterKeyword = text.substring(keywordIndex + keyword.length, keywordIndex + keyword.length + 150);
        console.log(`Found keyword "${keyword}", checking nearby text:`, textAfterKeyword);

        // Apply OCR corrections
        textAfterKeyword = correctOCRMistakes(textAfterKeyword);
        console.log("After OCR corrections:", textAfterKeyword);

        // Look for RC number pattern in the nearby text
        // More flexible pattern to catch variations
        const patterns = [
          /[A-Z]{2}[\s-]?\d{2}[\s-]?[A-Z]{1,2}[\s-]?\d{4,7}/i,
          /[A-Z]{2}\d[A-Z]\d{4,7}/i, // e.g., AN01J8844
        ];

        for (const pattern of patterns) {
          const match = textAfterKeyword.match(pattern);
          if (match) {
            const rcNumber = match[0].replace(/[\s-]/g, "").toUpperCase();
            console.log("Found RC number near keyword:", rcNumber);
            return rcNumber;
          }
        }
      }
    }

    // If not found near keywords, search entire text
    console.log("Keyword search failed, searching entire text...");

    // Apply OCR corrections to full text
    const correctedFullText = correctOCRMistakes(text);

    // Pattern: 2 letters + 2 digits + 1-2 letters + 4-7 digits
    const patterns = [
      /[A-Z]{2}\d{2}[A-Z]{1,2}\d{4,7}/g,
      // Also try with spaces/dashes
      /[A-Z]{2}[\s-]?\d{2}[\s-]?[A-Z]{1,2}[\s-]?\d{4,7}/gi,
      /[A-Z]{2}\d[A-Z]\d{4,7}/gi, // e.g., AN01J8844
    ];

    for (const pattern of patterns) {
      const matches = correctedFullText.match(pattern);
      if (matches && matches.length > 0) {
        const rcNumber = matches[0].replace(/[\s-]/g, "").toUpperCase();
        console.log("Found RC number in full text:", rcNumber);
        return rcNumber;
      }
    }

    console.log("No RC number found in text");
    return null;
  };

  const handleFileChange = async (file: File) => {
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        console.error("Please upload a valid image (JPG, PNG) or PDF file");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.error("File size should not exceed 5MB");
        return;
      }

      setFormData((prev) => ({ ...prev, rc_book_file: file }));

      // Start OCR extraction
      setIsExtractingOCR(true);

      try {
        console.log("Starting OCR extraction for:", file.name);

        // Perform OCR using Tesseract.js
        const result = await Tesseract.recognize(file, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        const extractedText = result.data.text;
        console.log("Extracted text:", extractedText);

        // Extract RC number from the text
        const rcNumber = extractRCNumber(extractedText);

        if (rcNumber) {
          console.log("RC Number found:", rcNumber);
          setFormData((prev) => ({ ...prev, rc_book_number: rcNumber }));
        } else {
          console.log("No RC number found in the document");
        }
      } catch (error) {
        console.error("OCR extraction failed:", error);
      } finally {
        setIsExtractingOCR(false);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleVehicleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const invalidFiles = files.filter((file) => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      console.error("Please upload only JPG or PNG images");
      return;
    }

    // Validate file sizes (max 5MB per image)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      console.error("Each image should not exceed 5MB");
      return;
    }

    // Limit to 5 images
    if (files.length > 5) {
      console.error("You can upload maximum 5 images");
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

      // Reverse geocode to get address
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
    if (!formData.registration_date) newErrors.registration_date = "Registration date is required";
    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Please select a location on the map";
    }
    if (!formData.driving_mode) newErrors.driving_mode = "Driving mode is required";
    // Driver is now required since we need their driving license number
    if (!formData.driver_id) {
      newErrors.driver_id = "Please select a driver for this vehicle";
    }
    if (!formData.rc_book_number) newErrors.rc_book_number = "RC book number is required";
    if (!formData.rc_book_file) newErrors.rc_book_file = "RC book file is required";

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
      const submitFormData = new FormData();
      // Use new vehicle type system
      submitFormData.append("vehicle_type_id", formData.vehicle_type_id);
      submitFormData.append("is_ac", formData.is_ac.toString());
      if (formData.vehicle_name) {
        submitFormData.append("vehicle_name", formData.vehicle_name);
      }
      if (formData.features.length > 0) {
        submitFormData.append("features", formData.features.join(", "));
      }
      submitFormData.append("fuel_type", formData.fuel_type);
      submitFormData.append("registration_date", new Date(formData.registration_date).toISOString());
      submitFormData.append("latitude", formData.latitude);
      submitFormData.append("longitude", formData.longitude);
      submitFormData.append("radius", formData.radius);
      submitFormData.append("driving_mode", formData.driving_mode);

      // Get driver's license number if driver is selected
      let drivingLicenseNumber = "";
      if (formData.driver_id) {
        submitFormData.append("driver_id", formData.driver_id);
        const selectedDriver = drivers.find((driver) => driver.id === formData.driver_id);
        if (selectedDriver && selectedDriver.driving_license_number) {
          drivingLicenseNumber = selectedDriver.driving_license_number;
        }
      }

      // Driving license number is required by backend
      if (drivingLicenseNumber) {
        submitFormData.append("driving_license_number", drivingLicenseNumber);
      } else {
        // If no driver selected or driver has no license, this shouldn't happen due to validation
        throw new Error("Driving license number is required. Please select a driver.");
      }

      submitFormData.append("rc_book_number", formData.rc_book_number);
      if (formData.rc_book_file) {
        submitFormData.append("rc_book_file", formData.rc_book_file);
      }

      // Add vehicle images if provided
      if (vehicleImages.length > 0) {
        vehicleImages.forEach((image) => {
          submitFormData.append("vehicle_images", image);
        });
      }

      await apiClient.addVehicle(submitFormData);
      onSuccess();
    } catch (error) {
      console.error("Failed to add vehicle:", error);
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

        {/* Registration Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.registration_date}
            onChange={(e) => handleInputChange("registration_date", e.target.value)}
            error={errors.registration_date}
          />
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

        {/* Assign Driver */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Assign Driver <span className="text-red-500">*</span>
          </label>
          {loadingDrivers ? (
            <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600">Loading drivers...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="px-4 py-3 border border-red-300 rounded-lg bg-red-50">
              <p className="text-sm text-red-600 font-medium">⚠️ No drivers available.</p>
              <p className="text-xs text-gray-600 mt-1">Please add drivers first in the Drivers tab before adding vehicles.</p>
            </div>
          ) : (
            <CustomDropdown
              options={drivers.map((driver) => ({
                value: driver.id,
                label: driver.name,
              }))}
              value={formData.driver_id}
              onChange={handleDriverChange}
              placeholder="Choose driver"
              error={errors.driver_id}
              searchable={true}
            />
          )}
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
            Search for a location or click on the map to set vehicle location
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

      {/* RC Book Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          RC Book Upload <span className="text-red-500">*</span>
        </label>
        {isExtractingOCR ? (
          <div className="border border-blue-300 rounded-lg p-6 bg-blue-50">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-blue-900 mb-1">Extracting RC Book Number...</p>
              <p className="text-xs text-blue-700">Please wait while we process your document</p>
            </div>
          </div>
        ) : formData.rc_book_file ? (
          <div className="space-y-2">
            <div className="border border-gray-300 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formData.rc_book_file.name}</p>
                    <p className="text-xs text-gray-600">
                      {(formData.rc_book_file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, rc_book_file: null, rc_book_number: "" }))}
                >
                  Remove
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {formData.rc_book_number ? "✓ RC book number extracted successfully" : "Upload completed"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg text-center transition-colors flex flex-col items-center justify-center cursor-pointer py-8 px-4 ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
              onClick={handleBrowseClick}
            >
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                {isDragging ? "Drop your file here" : "Drag and drop your RC book here"}
              </p>
              <p className="text-sm text-gray-500 mb-2">or click to browse</p>
              <p className="text-xs text-gray-500">
                JPG, PNG, PDF (Max 5MB) • OCR will extract RC number automatically
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            {errors.rc_book_file && <p className="text-red-500 text-sm">{errors.rc_book_file}</p>}
          </div>
        )}
      </div>

      {/* RC Book Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          RC Book Number <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="Will be auto-filled from RC book or enter manually"
          value={formData.rc_book_number}
          onChange={(e) => handleInputChange("rc_book_number", e.target.value)}
          error={errors.rc_book_number}
        />
      </div>

      {/* Vehicle Images Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Images (Optional) <span className="text-gray-500 text-xs">- Max 5 images</span>
        </label>
        <div className="space-y-3">
          <input
            ref={vehicleImagesInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            onChange={handleVehicleImagesChange}
            className="hidden"
            id="vehicle-images-upload"
          />
          <label
            htmlFor="vehicle-images-upload"
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
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 5MB each (Max 5 images)
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

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Adding Vehicle..." : "Add Vehicle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
