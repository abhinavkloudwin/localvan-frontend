"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchHeader } from "@/components/search/SearchHeader";
import { VehicleCard } from "@/components/search/VehicleCard";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { AuthModal } from "@/components/auth/AuthModal";
import type { User } from "@/lib/types";
import { calculateDistance, calculateBookingAmount } from "@/lib/pricing-utils";

function SearchVehiclesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [vehicleCategories, setVehicleCategories] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);

  // Search criteria from URL params
  const [searchCriteria, setSearchCriteria] = useState({
    pickupLocation: searchParams.get("pickup") || "",
    dropLocation: searchParams.get("drop") || "",
    pickupDate: searchParams.get("date") || "",
    pickupTime: searchParams.get("time") || "",
    latitude: parseFloat(searchParams.get("lat") || "0"),
    longitude: parseFloat(searchParams.get("lng") || "0"),
    dropLatitude: parseFloat(searchParams.get("dropLat") || "0"),
    dropLongitude: parseFloat(searchParams.get("dropLng") || "0"),
  });

  // Filters
  const [filters, setFilters] = useState({
    categoryId: "all",
    vehicleTypeId: "all",
    priceRange: [0, 50000] as [number, number],
    fuelType: "all",
    sortBy: "newest",
  });

  useEffect(() => {
    fetchUser();
    fetchVehicleCategories();
    fetchVehicleTypes();
    searchVehicles();
  }, []);

  useEffect(() => {
    // Extract available fuel types from vehicles
    if (vehicles.length > 0) {
      const fuelTypes = [...new Set(vehicles.map((v) => v.fuel_type).filter(Boolean))];
      setAvailableFuelTypes(fuelTypes);
    }
    applyFilters();
  }, [vehicles, filters]);

  const fetchUser = async () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        const userData = await apiClient.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const fetchVehicleCategories = async () => {
    try {
      const response = await apiClient.listVehicleCategories(true);
      if (response && response.data) {
        setVehicleCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle categories:", error);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await apiClient.listVehicleTypes(undefined, true);
      if (response && response.data) {
        setVehicleTypes(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle types:", error);
    }
  };

  const searchVehicles = async (criteria?: any) => {
    setLoading(true);
    try {
      // Use provided criteria or fallback to state
      const searchParams = criteria || searchCriteria;

      const response = await apiClient.searchVehicles({
        latitude: searchParams.latitude,
        longitude: searchParams.longitude,
        radius: 50, // 50km radius
      });

      const activeVehicles = response.data
        ? response.data.filter((v: any) => v.is_active)
        : [];
      setVehicles(activeVehicles);
    } catch (error) {
      console.error("Failed to search vehicles:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    // Filter by vehicle category
    if (filters.categoryId !== "all") {
      filtered = filtered.filter((v) => {
        if (v.vehicle_type_pricing) {
          const vehicleType = vehicleTypes.find((vt) => vt.id === v.vehicle_type_id);
          return vehicleType?.vehicle_category_id === filters.categoryId;
        }
        return false;
      });
    }

    // Filter by vehicle type (model type)
    if (filters.vehicleTypeId !== "all") {
      filtered = filtered.filter((v) => v.vehicle_type_id === filters.vehicleTypeId);
    }

    // Filter by fuel type
    if (filters.fuelType !== "all") {
      filtered = filtered.filter((v) => v.fuel_type === filters.fuelType);
    }

    // Filter by price range (dynamic pricing)
    if (searchCriteria.latitude && searchCriteria.dropLatitude) {
      filtered = filtered.filter((v) => {
        if (!v.vehicle_type_pricing) return true;

        const pricing = v.vehicle_type_pricing;
        const distance = calculateDistance(
          searchCriteria.latitude,
          searchCriteria.longitude,
          searchCriteria.dropLatitude,
          searchCriteria.dropLongitude
        );

        const { totalAmount } = calculateBookingAmount(pricing, distance, v.is_ac);
        return totalAmount >= filters.priceRange[0] && totalAmount <= filters.priceRange[1];
      });
    }

    // Sort
    switch (filters.sortBy) {
      case "rating":
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case "price_low":
        if (searchCriteria.latitude && searchCriteria.dropLatitude) {
          filtered.sort((a, b) => {
            const priceA = a.vehicle_type_pricing ? calculateBookingAmount(
              a.vehicle_type_pricing,
              calculateDistance(searchCriteria.latitude, searchCriteria.longitude, searchCriteria.dropLatitude, searchCriteria.dropLongitude),
              a.is_ac
            ).totalAmount : 0;
            const priceB = b.vehicle_type_pricing ? calculateBookingAmount(
              b.vehicle_type_pricing,
              calculateDistance(searchCriteria.latitude, searchCriteria.longitude, searchCriteria.dropLatitude, searchCriteria.dropLongitude),
              b.is_ac
            ).totalAmount : 0;
            return priceA - priceB;
          });
        }
        break;
      case "price_high":
        if (searchCriteria.latitude && searchCriteria.dropLatitude) {
          filtered.sort((a, b) => {
            const priceA = a.vehicle_type_pricing ? calculateBookingAmount(
              a.vehicle_type_pricing,
              calculateDistance(searchCriteria.latitude, searchCriteria.longitude, searchCriteria.dropLatitude, searchCriteria.dropLongitude),
              a.is_ac
            ).totalAmount : 0;
            const priceB = b.vehicle_type_pricing ? calculateBookingAmount(
              b.vehicle_type_pricing,
              calculateDistance(searchCriteria.latitude, searchCriteria.longitude, searchCriteria.dropLatitude, searchCriteria.dropLongitude),
              b.is_ac
            ).totalAmount : 0;
            return priceB - priceA;
          });
        }
        break;
      default:
        // Default sorting by creation date (newest first)
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    setFilteredVehicles(filtered);
  };

  const handleModifySearch = (newCriteria: any) => {
    setSearchCriteria(newCriteria);
    // Update URL params
    const params = new URLSearchParams({
      pickup: newCriteria.pickupLocation,
      drop: newCriteria.dropLocation,
      date: newCriteria.pickupDate,
      time: newCriteria.pickupTime,
      lat: newCriteria.latitude.toString(),
      lng: newCriteria.longitude.toString(),
      dropLat: newCriteria.dropLatitude?.toString() || "0",
      dropLng: newCriteria.dropLongitude?.toString() || "0",
    });
    router.push(`/search-vehicles?${params.toString()}`);
    // Pass the new criteria to searchVehicles so it uses the updated location immediately
    searchVehicles(newCriteria);
  };

  const handleVehicleBook = (vehicleId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    router.push(`/checkout/${vehicleId}?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f8]">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push("/")}>
              <Logo />
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <ProfileDropdown
                  user={user}
                  onEditProfile={() => {
                    // Redirect sub-owners to dashboard instead of edit profile
                    if (user.is_owner_sub_user) {
                      router.push("/owner/dashboard");
                    }
                    // Regular users: no action (can add modal later if needed)
                  }}
                />
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)} size="sm">
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Header */}
      <SearchHeader
        searchCriteria={searchCriteria}
        onModifySearch={handleModifySearch}
      />

      {/* Main Content */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
        <div className="flex gap-4">
          {/* Filters Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block w-1/4 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                vehicleCategories={vehicleCategories}
                vehicleTypes={vehicleTypes}
                availableFuelTypes={availableFuelTypes}
              />
            </div>
          </aside>

          {/* Vehicle Listings */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  {loading ? (
                    <h2 className="text-xl font-bold text-[#1d1d1d]">Searching vehicles...</h2>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-[#1d1d1d]">
                        {filteredVehicles.length} {filteredVehicles.length === 1 ? "Vehicle" : "Vehicles"} found
                      </h2>
                      <p className="text-sm text-[rgba(29,29,29,0.64)] mt-0.5">
                        {searchCriteria.pickupLocation} → {searchCriteria.dropLocation}
                      </p>
                    </>
                  )}
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Vehicle Cards */}
            <div className="flex flex-col gap-4">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 shadow-sm animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="w-64 h-48 bg-gray-200 rounded-xl flex-shrink-0"></div>
                      <div className="flex-1 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredVehicles.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
                  <div className="mb-6">
                    <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">
                    No vehicles found
                  </h3>
                  <p className="text-[rgba(29,29,29,0.64)] mb-6 max-w-md mx-auto">
                    Try adjusting your filters or search in a different location
                  </p>
                  <Button onClick={() => router.push("/")}>
                    Back to Home
                  </Button>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    searchCriteria={searchCriteria}
                    onBook={handleVehicleBook}
                  />
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          fetchUser();
        }}
      />
    </div>
  );
}

export default function SearchVehicles() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchVehiclesContent />
    </Suspense>
  );
}
