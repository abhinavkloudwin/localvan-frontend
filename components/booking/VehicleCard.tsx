"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import RatingBadge from "../reviews/RatingBadge";
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

interface VehicleCardProps {
  vehicle: Vehicle;
  onViewDetails: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onViewDetails }) => {
  const features = vehicle.features ? vehicle.features.split(", ") : [];
  const displayFeatures = features.slice(0, 4);
  const remainingFeatures = features.length - displayFeatures.length;

  const defaultImage = "/images/default-vehicle.png";
  const vehicleImage = vehicle.vehicle_images && vehicle.vehicle_images.length > 0
    ? vehicle.vehicle_images[0]
    : defaultImage;

  const [rating, setRating] = useState<{ average_rating: number; total_reviews: number } | null>(null);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const ratingData = await apiClient.getVehicleRating(vehicle.id);
        setRating(ratingData);
      } catch (err) {
        // Silently fail - rating is optional
        setRating(null);
      }
    };

    fetchRating();
  }, [vehicle.id]);

  return (
    <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Vehicle Image */}
      <div className="relative h-40 sm:h-48 bg-gray-200">
        <img
          src={vehicleImage}
          alt={vehicle.model}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        {vehicle.vehicle_images && vehicle.vehicle_images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            +{vehicle.vehicle_images.length - 1} photos
          </div>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{vehicle.model}</h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{vehicle.vehicle_type}</p>
            {rating && rating.total_reviews > 0 && (
              <div className="mt-1">
                <RatingBadge
                  rating={rating.average_rating}
                  showCount
                  reviewCount={rating.total_reviews}
                  size="sm"
                />
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg sm:text-xl font-bold text-blue-600">₹{(vehicle.booking_amount || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">per day</p>
          </div>
        </div>

        {/* Vehicle Specs */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{vehicle.fuel_type}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="capitalize">{vehicle.driving_mode}</span>
          </div>
        </div>

        {/* Features */}
        {displayFeatures.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {displayFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md"
                >
                  {feature}
                </span>
              ))}
              {remainingFeatures > 0 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md">
                  +{remainingFeatures} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => onViewDetails(vehicle)}
          variant="primary"
          className="w-full"
          size="sm"
        >
          View Details & Book
        </Button>
      </div>
    </div>
  );
};
