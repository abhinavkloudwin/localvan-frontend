"use client";

import React, { useMemo } from "react";

interface FilterSidebarProps {
  filters: {
    categoryId: string;
    vehicleTypeId: string;
    priceRange: [number, number];
    fuelType: string;
    sortBy: string;
  };
  onFilterChange: (filters: any) => void;
  vehicleCategories: any[];
  vehicleTypes: any[];
  availableFuelTypes: string[];
}

export function FilterSidebar({
  filters,
  onFilterChange,
  vehicleCategories,
  vehicleTypes,
  availableFuelTypes,
}: FilterSidebarProps) {
  // Filter vehicle types based on selected category
  const filteredVehicleTypes = useMemo(() => {
    if (filters.categoryId === "all") {
      return vehicleTypes;
    }
    return vehicleTypes.filter((vt) => vt.vehicle_category_id === filters.categoryId);
  }, [filters.categoryId, vehicleTypes]);

  const handleCategoryChange = (categoryId: string) => {
    // Reset vehicle type when category changes
    onFilterChange({ ...filters, categoryId, vehicleTypeId: "all" });
  };

  const handleVehicleTypeChange = (vehicleTypeId: string) => {
    onFilterChange({ ...filters, vehicleTypeId });
  };

  const handleFuelTypeChange = (type: string) => {
    onFilterChange({ ...filters, fuelType: type });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value);
    onFilterChange({ ...filters, priceRange: [filters.priceRange[0], newMax] as [number, number] });
  };

  const handleResetFilters = () => {
    onFilterChange({
      categoryId: "all",
      vehicleTypeId: "all",
      priceRange: [0, 50000] as [number, number],
      fuelType: "all",
      sortBy: filters.sortBy, // Keep current sort
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e6e6e6]">
        <h3 className="text-sm font-bold text-[#1d1d1d] uppercase tracking-wide">Filters</h3>
        <button
          onClick={handleResetFilters}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Vehicle Category Filter */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-[#1d1d1d] mb-3 uppercase tracking-wide">Vehicle Category</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer py-1.5 hover:opacity-70 transition-opacity">
            <input
              type="radio"
              name="categoryId"
              value="all"
              checked={filters.categoryId === "all"}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className={`ml-2.5 text-sm ${
              filters.categoryId === "all" ? "text-[#1d1d1d] font-medium" : "text-[rgba(29,29,29,0.64)]"
            }`}>
              All Categories
            </span>
          </label>
          {vehicleCategories.map((category) => (
            <label
              key={category.id}
              className="flex items-center cursor-pointer py-1.5 hover:opacity-70 transition-opacity"
            >
              <input
                type="radio"
                name="categoryId"
                value={category.id}
                checked={filters.categoryId === category.id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className={`ml-2.5 text-sm ${
                filters.categoryId === category.id ? "text-[#1d1d1d] font-medium" : "text-[rgba(29,29,29,0.64)]"
              }`}>
                {category.category_name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Vehicle Type (Model) Filter */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <h4 className="text-xs font-bold text-[#1d1d1d] mb-3 uppercase tracking-wide">Vehicle Type</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer py-1.5 hover:opacity-70 transition-opacity">
            <input
              type="radio"
              name="vehicleTypeId"
              value="all"
              checked={filters.vehicleTypeId === "all"}
              onChange={(e) => handleVehicleTypeChange(e.target.value)}
              className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className={`ml-2.5 text-sm ${
              filters.vehicleTypeId === "all" ? "text-[#1d1d1d] font-medium" : "text-[rgba(29,29,29,0.64)]"
            }`}>
              All Types
            </span>
          </label>
          {filteredVehicleTypes.length > 0 ? (
            filteredVehicleTypes.map((type) => (
              <label
                key={type.id}
                className="flex items-center cursor-pointer py-1.5 hover:opacity-70 transition-opacity"
              >
                <input
                  type="radio"
                  name="vehicleTypeId"
                  value={type.id}
                  checked={filters.vehicleTypeId === type.id}
                  onChange={(e) => handleVehicleTypeChange(e.target.value)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className={`ml-2.5 text-sm ${
                  filters.vehicleTypeId === type.id ? "text-[#1d1d1d] font-medium" : "text-[rgba(29,29,29,0.64)]"
                }`}>
                  {type.model_type} ({type.seats} seats)
                </span>
              </label>
            ))
          ) : (
            <p className="text-xs text-[rgba(29,29,29,0.64)] italic">
              {filters.categoryId === "all" ? "Loading..." : "No vehicle types available"}
            </p>
          )}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 pb-6 border-b border-[#e6e6e6]">
        <h4 className="text-xs font-bold text-[#1d1d1d] mb-3 uppercase tracking-wide">Max Price</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[rgba(29,29,29,0.64)]">₹0</span>
            <span className="font-semibold text-[#1d1d1d]">₹{filters.priceRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50000"
            step="500"
            value={filters.priceRange[1]}
            onChange={handlePriceChange}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-xs text-[rgba(29,29,29,0.64)] italic">
            Based on trip distance
          </p>
        </div>
      </div>

      {/* Fuel Type Filter */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-[#1d1d1d] mb-3 uppercase tracking-wide">Fuel Type</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer py-1.5 hover:opacity-70 transition-opacity">
            <input
              type="radio"
              name="fuelType"
              value="all"
              checked={filters.fuelType === "all"}
              onChange={(e) => handleFuelTypeChange(e.target.value)}
              className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className={`ml-2.5 text-sm ${
              filters.fuelType === "all" ? "text-[#1d1d1d] font-medium" : "text-[rgba(29,29,29,0.64)]"
            }`}>
              All Fuel Types
            </span>
          </label>
          {availableFuelTypes.length > 0 ? (
            availableFuelTypes.map((fuel) => (
              <label
                key={fuel}
                className="flex items-center cursor-pointer py-1.5 hover:opacity-70 transition-opacity"
              >
                <input
                  type="radio"
                  name="fuelType"
                  value={fuel}
                  checked={filters.fuelType === fuel}
                  onChange={(e) => handleFuelTypeChange(e.target.value)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className={`ml-2.5 text-sm ${
                  filters.fuelType === fuel ? "text-[#1d1d1d] font-medium" : "text-[rgba(29,29,29,0.64)]"
                }`}>
                  {fuel}
                </span>
              </label>
            ))
          ) : (
            <p className="text-xs text-[rgba(29,29,29,0.64)] italic">No fuel types available</p>
          )}
        </div>
      </div>
    </div>
  );
}
