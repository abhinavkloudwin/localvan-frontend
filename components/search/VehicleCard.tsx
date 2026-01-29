"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { calculateDistance, calculateBookingAmount } from "@/lib/pricing-utils";

interface VehicleCardProps {
  vehicle: any;
  searchCriteria: any;
  onBook: (vehicleId: string) => void;
}

export function VehicleCard({ vehicle, searchCriteria, onBook }: VehicleCardProps) {

  // Calculate dynamic pricing - ALWAYS show a price
  const pricingInfo = useMemo(() => {
    if (!vehicle.vehicle_type_pricing) {
      return null;
    }

    const pricing = vehicle.vehicle_type_pricing;

    // Check if we have drop location coordinates for exact pricing
    if (
      searchCriteria.latitude &&
      searchCriteria.longitude &&
      searchCriteria.dropLatitude &&
      searchCriteria.dropLongitude
    ) {
      // Calculate exact distance
      const distance = calculateDistance(
        searchCriteria.latitude,
        searchCriteria.longitude,
        searchCriteria.dropLatitude,
        searchCriteria.dropLongitude
      );

      // Calculate exact price based on distance
      const exactPricing = calculateBookingAmount(
        pricing,
        distance,
        vehicle.is_ac
      );

      return {
        totalAmount: exactPricing.totalAmount,
        isExact: true,
      };
    }

    // Calculate starting price based on base km
    const baseKm = pricing.base_km || 0;
    const baseKmRate = pricing.base_km_rate || 0;
    const extraKmRate = pricing.extra_km_rate || 0;
    const acChargePerKm = vehicle.is_ac ? (pricing.ac_charge_per_km || 0) : 0;

    // Base amount for minimum km
    const baseAmount = baseKmRate + (acChargePerKm * baseKm);

    return {
      totalAmount: baseAmount,
      isExact: false,
    };
  }, [vehicle, searchCriteria]);

  const formatFuelType = (fuel: string) => {
    const fuelMap: Record<string, string> = {
      petrol: "Petrol",
      diesel: "Diesel",
      electric: "Electric",
      hybrid: "Hybrid",
      cng: "CNG",
    };
    return fuelMap[fuel?.toLowerCase()] || fuel;
  };

  const formatVehicleType = (type: string) => {
    const typeMap: Record<string, string> = {
      sedan: "Sedan",
      suv: "SUV",
      luxury: "Luxury Car",
      van: "Van/Minibus",
      tempo: "Tempo Traveller",
      bus: "Bus",
    };
    return typeMap[type?.toLowerCase()] || type;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "bg-green-600";
    if (rating >= 4.0) return "bg-green-500";
    if (rating >= 3.5) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.12)] transition-shadow">
      <div className="p-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Vehicle Image */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="relative h-44 lg:h-40 rounded-xl overflow-hidden bg-gray-100">
              {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                <Image
                  src={vehicle.vehicle_images[0]}
                  alt={vehicle.model}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="flex-1 flex flex-col lg:flex-row gap-5 min-w-0">
            {/* Left: Vehicle Info */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="mb-2.5">
                <h3 className="text-base font-bold text-[#1d1d1d] mb-1 truncate">
                  {vehicle.vehicle_name || vehicle.model || vehicle.vehicle_type_pricing?.model_type || "Premium Vehicle"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[rgba(29,29,29,0.64)] flex-wrap">
                  <span>{vehicle.vehicle_type_pricing?.model_type || formatVehicleType(vehicle.vehicle_type || "N/A")}</span>
                  {vehicle.is_ac && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">AC</span>
                    </>
                  )}
                  {vehicle.average_rating && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {vehicle.average_rating.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Specs */}
              <div className="flex items-center gap-2.5 mb-2.5 text-xs text-[rgba(29,29,29,0.64)] flex-wrap">
                <span>{formatFuelType(vehicle.fuel_type)}</span>
                <span>•</span>
                <span className="capitalize">{vehicle.driving_mode}</span>
                {vehicle.total_reviews > 0 && (
                  <>
                    <span>•</span>
                    <span>{vehicle.total_reviews} reviews</span>
                  </>
                )}
              </div>

              {/* Features */}
              {vehicle.features && (
                <p className="text-xs text-[rgba(29,29,29,0.64)] line-clamp-2">
                  {vehicle.features}
                </p>
              )}
            </div>

            {/* Right: Price and Button */}
            <div className="flex flex-col justify-between lg:w-44 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[#e6e6e6] pt-4 lg:pt-0 lg:pl-5">
              <div className="text-right lg:text-right mb-auto">
                {pricingInfo ? (
                  <>
                    <div className="text-2xl lg:text-xl font-bold text-[#1d1d1d]">
                      ₹{Math.round(pricingInfo.totalAmount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-[rgba(29,29,29,0.64)] mt-1">
                      {pricingInfo.isExact ? "Total fare" : "Starting from"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-blue-600">
                      Price on booking
                    </div>
                    <div className="text-xs text-[rgba(29,29,29,0.64)] mt-1">Based on distance</div>
                  </>
                )}
              </div>

              <button
                onClick={() => onBook(vehicle.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors w-full mt-3"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
