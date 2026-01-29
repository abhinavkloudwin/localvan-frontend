"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import RatingBadge from "../reviews/RatingBadge";
import ReviewsList from "../reviews/ReviewsList";
import { apiClient } from "@/lib/api-client";

interface Vehicle {
  id: string;
  vehicle_type: string;
  model: string;
  features: string | null;
  fuel_type: string;
  booking_amount: number;
  driving_mode: string;
  vehicle_images: string[] | null;
  registration_date?: string;
  rc_book_number?: string;
  is_active: boolean;
}

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onBook?: (vehicle: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onBook,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rating, setRating] = useState<{ average_rating: number; total_reviews: number } | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (isOpen && vehicle) {
      const fetchRating = async () => {
        try {
          const ratingData = await apiClient.getVehicleRating(vehicle.id);
          setRating(ratingData);
        } catch (err) {
          setRating(null);
        }
      };

      fetchRating();
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const features = vehicle.features ? vehicle.features.split(", ") : [];
  const images = vehicle.vehicle_images && vehicle.vehicle_images.length > 0
    ? vehicle.vehicle_images
    : ["/images/default-vehicle.png"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBook = () => {
    if (onBook) {
      onBook(vehicle);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-0 sm:p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-4xl h-full sm:h-auto sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl sm:rounded-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Gallery */}
          <div className="relative h-56 sm:h-80 md:h-96 bg-gray-200">
            <img
              src={images[currentImageIndex]}
              alt={vehicle.model}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/default-vehicle.png";
              }}
            />

            {images.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-14rem)] sm:max-h-none">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">{vehicle.model}</h2>
                <p className="text-base sm:text-lg text-gray-600 truncate">{vehicle.vehicle_type}</p>
                {rating && rating.total_reviews > 0 && (
                  <div className="mt-2">
                    <RatingBadge
                      rating={rating.average_rating}
                      showCount
                      reviewCount={rating.total_reviews}
                      size="md"
                    />
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">₹{(vehicle.booking_amount || 0).toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-gray-500">per day</p>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Fuel Type</p>
                <p className="font-semibold text-gray-900">{vehicle.fuel_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Driving Mode</p>
                <p className="font-semibold text-gray-900 capitalize">{vehicle.driving_mode}</p>
              </div>
              {vehicle.registration_date && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Registration</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(vehicle.registration_date).getFullYear()}
                  </p>
                </div>
              )}
              {vehicle.rc_book_number && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">RC Number</p>
                  <p className="font-semibold text-gray-900 text-sm">{vehicle.rc_book_number}</p>
                </div>
              )}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Features & Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Gallery</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${vehicle.model} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {rating && rating.total_reviews > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Customer Reviews ({rating.total_reviews})
                  </h3>
                  {rating.total_reviews > 5 && !showAllReviews && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All
                    </button>
                  )}
                </div>
                <ReviewsList
                  vehicleId={vehicle.id}
                  limit={showAllReviews ? 20 : 5}
                  showLoadMore={showAllReviews}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white pt-4 border-t sm:border-0">
              <Button
                onClick={handleBook}
                variant="primary"
                className="flex-1 w-full sm:w-auto"
              >
                Book Now
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
