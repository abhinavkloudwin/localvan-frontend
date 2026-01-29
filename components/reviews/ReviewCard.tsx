"use client";

import { Review, ReviewWithDetails } from "@/lib/types";
import StarRating from "./StarRating";
import { User } from "lucide-react";

interface ReviewCardProps {
  review: Review | ReviewWithDetails;
  showVehicle?: boolean;
}

export default function ReviewCard({ review, showVehicle = false }: ReviewCardProps) {
  const reviewWithDetails = review as ReviewWithDetails;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        {/* Review Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-gray-900">
                {reviewWithDetails.user_name || "Anonymous User"}
              </p>
              {showVehicle && reviewWithDetails.vehicle_model && (
                <p className="text-sm text-gray-600">
                  {reviewWithDetails.vehicle_model}
                  {reviewWithDetails.vehicle_type && (
                    <span className="text-gray-400">
                      {" "}
                      • {reviewWithDetails.vehicle_type}
                    </span>
                  )}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(review.created_at)}
            </span>
          </div>

          {/* Rating */}
          <div className="mb-2">
            <StarRating value={review.rating} readonly size="sm" />
          </div>

          {/* Review Text */}
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {review.review}
          </p>

          {/* Driver mention if exists */}
          {reviewWithDetails.driver_name && (
            <p className="text-xs text-gray-500 mt-2">
              Driver: {reviewWithDetails.driver_name}
            </p>
          )}

          {/* Inactive badge for admins */}
          {!review.is_active && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                Deactivated
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
