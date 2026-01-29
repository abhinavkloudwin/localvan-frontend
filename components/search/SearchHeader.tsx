"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

interface SearchHeaderProps {
  searchCriteria: {
    pickupLocation: string;
    dropLocation: string;
    pickupDate: string;
    pickupTime: string;
    latitude: number;
    longitude: number;
    dropLatitude?: number;
    dropLongitude?: number;
  };
  onModifySearch: (criteria: any) => void;
}

export function SearchHeader({ searchCriteria, onModifySearch }: SearchHeaderProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [modifiedCriteria, setModifiedCriteria] = useState(searchCriteria);
  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [dropAutocomplete, setDropAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Sync modifiedCriteria when searchCriteria changes
  useEffect(() => {
    setModifiedCriteria(searchCriteria);
  }, [searchCriteria]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const onPickupLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setPickupAutocomplete(autocompleteInstance);
  };

  const onDropLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setDropAutocomplete(autocompleteInstance);
  };

  const onPickupPlaceChanged = () => {
    if (pickupAutocomplete !== null) {
      const place = pickupAutocomplete.getPlace();

      // Check if place has valid geometry data
      if (!place.geometry || !place.geometry.location) {
        console.log("No geometry data for pickup place");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const updatedCriteria = {
        ...searchCriteria,
        pickupLocation: place.formatted_address || place.name || "",
        latitude: lat,
        longitude: lng,
      };

      console.log("Pickup place selected:", updatedCriteria);
      setEditingField(null);
      onModifySearch(updatedCriteria);
    }
  };

  const onDropPlaceChanged = () => {
    if (dropAutocomplete !== null) {
      const place = dropAutocomplete.getPlace();

      // Check if place has valid geometry data
      if (!place.geometry || !place.geometry.location) {
        console.log("No geometry data for drop place");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const updatedCriteria = {
        ...searchCriteria,
        dropLocation: place.formatted_address || place.name || "",
        dropLatitude: lat,
        dropLongitude: lng,
      };

      console.log("Drop place selected:", updatedCriteria);
      setEditingField(null);
      onModifySearch(updatedCriteria);
    }
  };

  const handleFieldClick = (field: string) => {
    setEditingField(field);
    setModifiedCriteria(searchCriteria);
  };

  const handleDateTimeBlur = () => {
    if (JSON.stringify(modifiedCriteria) !== JSON.stringify(searchCriteria)) {
      onModifySearch(modifiedCriteria);
    }
    setEditingField(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDateTimeBlur();
    }
  };

  if (loadError) {
    return <div className="text-red-600">Failed to load Google Maps</div>;
  }

  if (!isLoaded) {
    return (
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div ref={containerRef} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          {/* Pickup Location */}
          <div className="flex-1 min-w-[200px]">
            {editingField === 'pickup' ? (
              <Autocomplete
                onLoad={onPickupLoad}
                onPlaceChanged={onPickupPlaceChanged}
                options={{
                  componentRestrictions: { country: "in" }
                }}
              >
                <input
                  type="text"
                  value={modifiedCriteria.pickupLocation}
                  onChange={(e) =>
                    setModifiedCriteria({
                      ...modifiedCriteria,
                      pickupLocation: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  autoFocus
                  placeholder="Pickup location"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                />
              </Autocomplete>
            ) : (
              <button
                onClick={() => handleFieldClick('pickup')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left group"
              >
                <div className="text-xs text-gray-500 mb-0.5">Pickup</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {searchCriteria.pickupLocation || "Select location"}
                </div>
              </button>
            )}
          </div>

          {/* Arrow */}
          <div className="hidden sm:block text-gray-400 mt-5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>

          {/* Drop Location */}
          <div className="flex-1 min-w-[200px]">
            {editingField === 'drop' ? (
              <Autocomplete
                onLoad={onDropLoad}
                onPlaceChanged={onDropPlaceChanged}
                options={{
                  componentRestrictions: { country: "in" }
                }}
              >
                <input
                  type="text"
                  value={modifiedCriteria.dropLocation}
                  onChange={(e) =>
                    setModifiedCriteria({
                      ...modifiedCriteria,
                      dropLocation: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  autoFocus
                  placeholder="Drop location"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                />
              </Autocomplete>
            ) : (
              <button
                onClick={() => handleFieldClick('drop')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left group"
              >
                <div className="text-xs text-gray-500 mb-0.5">Drop</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {searchCriteria.dropLocation || "Select location"}
                </div>
              </button>
            )}
          </div>

          {/* Date */}
          <div className="w-full sm:w-auto">
            {editingField === 'date' ? (
              <input
                type="date"
                value={modifiedCriteria.pickupDate}
                min={today}
                onChange={(e) =>
                  setModifiedCriteria({
                    ...modifiedCriteria,
                    pickupDate: e.target.value,
                  })
                }
                onBlur={handleDateTimeBlur}
                onKeyPress={handleKeyPress}
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
              />
            ) : (
              <button
                onClick={() => handleFieldClick('date')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left"
              >
                <div className="text-xs text-gray-500 mb-0.5">Date</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(searchCriteria.pickupDate)}
                </div>
              </button>
            )}
          </div>

          {/* Time */}
          <div className="w-full sm:w-auto">
            {editingField === 'time' ? (
              <input
                type="time"
                value={modifiedCriteria.pickupTime}
                onChange={(e) =>
                  setModifiedCriteria({
                    ...modifiedCriteria,
                    pickupTime: e.target.value,
                  })
                }
                onBlur={handleDateTimeBlur}
                onKeyPress={handleKeyPress}
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
              />
            ) : (
              <button
                onClick={() => handleFieldClick('time')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left"
              >
                <div className="text-xs text-gray-500 mb-0.5">Time</div>
                <div className="text-sm font-medium text-gray-900">
                  {searchCriteria.pickupTime || "Select"}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
