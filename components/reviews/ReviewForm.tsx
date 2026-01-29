"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import { Button } from "../ui/Button";
import { apiClient } from "@/lib/api-client";

interface ReviewFormProps {
  bookingId: string;
  vehicleModel: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  bookingId,
  vehicleModel,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (review.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiClient.createReview({
        booking_id: bookingId,
        review: review.trim(),
        rating,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-black mb-2">
          Rate your experience with {vehicleModel}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Your feedback helps other users make better decisions
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label
          htmlFor="review"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Review
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this vehicle..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-black"
          rows={5}
          maxLength={2000}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {review.length}/2000 characters
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || rating === 0}>
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
