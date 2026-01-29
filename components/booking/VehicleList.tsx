"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VehicleCard } from "./VehicleCard";
import { VehicleDetailModal } from "./VehicleDetailModal";
import { VEHICLE_TYPES, VEHICLE_FEATURES } from "@/lib/vehicle-constants";
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

interface VehicleListProps {
  vehicles: Vehicle[];
  isLoading?: boolean;
  onAuthRequired?: () => void;
  searchData?: any;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  isLoading,
  onAuthRequired,
  searchData
}) => {
  const router = useRouter();
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(vehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    setFilteredVehicles(vehicles);
    // Calculate price range from vehicles
    if (vehicles.length > 0) {
      const prices = vehicles.map(v => v.booking_amount);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      setPriceRange([minPrice, maxPrice]);
    }
  }, [vehicles]);

  // Apply filters
  useEffect(() => {
    let filtered = [...vehicles];

    // Filter by vehicle type
    if (selectedVehicleTypes.length > 0) {
      filtered = filtered.filter(v => selectedVehicleTypes.includes(v.vehicle_type));
    }

    // Filter by features
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter(v => {
        if (!v.features) return false;
        const vehicleFeatures = v.features.split(", ");
        return selectedFeatures.every(sf => vehicleFeatures.includes(sf));
      });
    }

    // Filter by price range
    filtered = filtered.filter(v =>
      v.booking_amount >= priceRange[0] && v.booking_amount <= priceRange[1]
    );

    setFilteredVehicles(filtered);
  }, [selectedVehicleTypes, selectedFeatures, priceRange, vehicles]);

  const handleVehicleTypeToggle = (type: string) => {
    setSelectedVehicleTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const clearFilters = () => {
    setSelectedVehicleTypes([]);
    setSelectedFeatures([]);
    if (vehicles.length > 0) {
      const prices = vehicles.map(v => v.booking_amount);
      setPriceRange([Math.min(...prices), Math.max(...prices)]);
    }
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleBook = (vehicle: Vehicle) => {
    // Check if user is authenticated
    const token = apiClient.getToken();

    if (!token) {
      // User not logged in, trigger auth modal
      if (onAuthRequired) {
        onAuthRequired();
      }
      handleCloseModal();
      return;
    }

    // User is logged in, navigate to checkout with search data
    const queryParams = new URLSearchParams();

    if (searchData) {
      if (searchData.pickupLocation) {
        queryParams.append('pickup', searchData.pickup || '');
        queryParams.append('pickupLat', searchData.pickupLocation.latitude.toString());
        queryParams.append('pickupLong', searchData.pickupLocation.longitude.toString());
      }
      if (searchData.dropoffLocation) {
        queryParams.append('drop', searchData.dropoff || '');
        queryParams.append('dropLat', searchData.dropoffLocation.latitude.toString());
        queryParams.append('dropLong', searchData.dropoffLocation.longitude.toString());
      }
      if (searchData.date) {
        queryParams.append('date', searchData.date);
      }
      if (searchData.time) {
        queryParams.append('time', searchData.time);
      }
    }

    const queryString = queryParams.toString();
    const url = `/checkout/${vehicle.id}${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const minPrice = vehicles.length > 0 ? Math.min(...vehicles.map(v => v.booking_amount)) : 0;
  const maxPrice = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.booking_amount)) : 50000;

  return (
    <div className="w-full px-4 py-6 md:py-8">
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar - Mobile: Full screen overlay, Desktop: Sidebar */}
        {showFilters && (
          <>
            {/* Mobile Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowFilters(false)}
            />

            {/* Filter Panel */}
            <div className={`
              fixed md:static inset-y-0 left-0 z-50 md:z-0
              w-80 md:w-80
              transform transition-transform duration-300 ease-in-out
              md:transform-none
              ${showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <div className="bg-white rounded-none md:rounded-xl border-r md:border border-gray-200 p-6 h-full md:h-auto overflow-y-auto md:sticky md:top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear All
                    </button>
                    {/* Mobile Close Button */}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="md:hidden p-1 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

            {/* Vehicle Type Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Vehicle Type</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {VEHICLE_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedVehicleTypes.includes(type.value)}
                      onChange={() => handleVehicleTypeToggle(type.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Features Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Features</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {VEHICLE_FEATURES.slice(0, 10).map((feature) => (
                  <label key={feature.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.value)}
                      onChange={() => handleFeatureToggle(feature.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>
              </div>
            </div>
          </>
        )}

        {/* Hidden on desktop when showFilters is true */}
        {!showFilters && (
          <div className="hidden md:block w-80"></div>
        )}

        {/* Vehicle List */}
        <div className="flex-1 w-full">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {filteredVehicles.length} Vehicle{filteredVehicles.length !== 1 ? 's' : ''} Available
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {selectedVehicleTypes.length > 0 || selectedFeatures.length > 0
                  ? "Filtered results"
                  : "Showing all vehicles"}
              </p>
            </div>
          </div>

          {/* No Results */}
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg className="mx-auto h-16 w-16 md:h-24 md:w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
              <p className="text-sm md:text-base text-gray-600 mb-4">Try adjusting your filters to see more results</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Vehicle Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onBook={handleBook}
      />
    </div>
  );
};
