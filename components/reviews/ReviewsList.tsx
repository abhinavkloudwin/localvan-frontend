"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Review } from "@/lib/types";
import ReviewCard from "./ReviewCard";
import { Button } from "../ui/Button";

interface ReviewsListProps {
  vehicleId?: string;
  driverId?: string;
  ownerId?: string;
  limit?: number;
  showLoadMore?: boolean;
}

export default function ReviewsList({
  vehicleId,
  driverId,
  ownerId,
  limit = 10,
  showLoadMore = true,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async (currentSkip: number) => {
    try {
      setLoading(true);
      setError("");

      let response;

      if (vehicleId) {
        response = await apiClient.getVehicleReviews(
          vehicleId,
          currentSkip,
          limit
        );
      } else if (driverId) {
        response = await apiClient.getDriverReviews(currentSkip, limit);
      } else if (ownerId) {
        response = await apiClient.getOwnerVehicleReviews(
          undefined,
          currentSkip,
          limit
        );
      } else {
        response = await apiClient.getMyReviews(currentSkip, limit);
      }

      const newReviews = response.data || [];
      const totalCount = response.total || 0;

      if (currentSkip === 0) {
        setReviews(newReviews);
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
      }

      setTotal(totalCount);
      setHasMore(currentSkip + newReviews.length < totalCount);
    } catch (err: any) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(0);
  }, [vehicleId, driverId, ownerId]);

  const handleLoadMore = () => {
    const newSkip = skip + limit;
    setSkip(newSkip);
    fetchReviews(newSkip);
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg h-32 animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Be the first to share your experience
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Showing {reviews.length} of {total} reviews
        </p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {showLoadMore && hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
