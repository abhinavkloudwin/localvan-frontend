"use client";

import { Star } from "lucide-react";

interface RatingBadgeProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  reviewCount?: number;
}

export default function RatingBadge({
  rating,
  size = "md",
  showCount = false,
  reviewCount,
}: RatingBadgeProps) {
  // Color based on rating
  const getColor = (rating: number): string => {
    if (rating < 2.5) return "bg-red-100 text-red-800 border-red-200";
    if (rating < 4.0) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-md border ${getColor(rating)} ${sizes[size]}`}
      >
        <Star size={iconSizes[size]} className="fill-current" />
        <span>{rating.toFixed(1)}</span>
      </span>
      {showCount && reviewCount !== undefined && (
        <span className="text-sm text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
}
