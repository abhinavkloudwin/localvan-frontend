"use client";

import React, { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

type TripType = "oneway" | "roundtrip";

const libraries: ("places")[] = ["places"];

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface BookingFormProps {
  onSearch?: (data: any) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSearch }) => {
  const [tripType, setTripType] = useState<TripType>("oneway");
  const [formData, setFormData] = useState({
    pickup: "",
    dropoff: "",
    date: "",
    time: "",
    returnDate: "",
    vehicleType: "sedan",
  });

  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const onPickupLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setPickupAutocomplete(autocompleteInstance);
  };

  const onDropoffLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setDropoffAutocomplete(autocompleteInstance);
  };

  const onPickupPlaceChanged = () => {
    if (pickupAutocomplete !== null) {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPickupLocation({
          address: place.formatted_address || "",
          latitude: lat,
          longitude: lng,
        });
        setFormData({ ...formData, pickup: place.formatted_address || "" });
      }
    }
  };

  const onDropoffPlaceChanged = () => {
    if (dropoffAutocomplete !== null) {
      const place = dropoffAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setDropoffLocation({
          address: place.formatted_address || "",
          latitude: lat,
          longitude: lng,
        });
        setFormData({ ...formData, dropoff: place.formatted_address || "" });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchData = {
      ...formData,
      tripType,
      pickupLocation,
      dropoffLocation,
    };
    console.log("Booking data:", searchData);
    if (onSearch) {
      onSearch(searchData);
    }
  };

  const swapLocations = () => {
    setFormData({
      ...formData,
      pickup: formData.dropoff,
      dropoff: formData.pickup,
    });
    const tempLocation = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(tempLocation);
  };

  if (loadError) {
    return <div className="text-red-600">Failed to load Google Maps</div>;
  }

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Single Row - All Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pickup Location */}
          <div>
            <label htmlFor="pickup-input" className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <Autocomplete
                onLoad={onPickupLoad}
                onPlaceChanged={onPickupPlaceChanged}
                options={{
                  componentRestrictions: { country: "in" }
                }}
              >
                <input
                  id="pickup-input"
                  type="text"
                  placeholder="Kochi"
                  value={formData.pickup}
                  onChange={(e) =>
                    setFormData({ ...formData, pickup: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50"
                />
              </Autocomplete>
            </div>
          </div>

          {/* Drop-off Location */}
          <div>
            <label htmlFor="dropoff-input" className="block text-sm font-semibold text-gray-700 mb-2">
              Drop Location
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <Autocomplete
                onLoad={onDropoffLoad}
                onPlaceChanged={onDropoffPlaceChanged}
                options={{
                  componentRestrictions: { country: "in" }
                }}
              >
                <input
                  id="dropoff-input"
                  type="text"
                  placeholder="Thiruvananthapuram"
                  value={formData.dropoff}
                  onChange={(e) =>
                    setFormData({ ...formData, dropoff: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50"
                />
              </Autocomplete>
            </div>
          </div>

          {/* Time */}
          <div>
            <label htmlFor="time-input" className="block text-sm font-semibold text-gray-700 mb-2">
              Time
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <input
                id="time-input"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 bg-gray-50"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date-input" className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <input
                id="date-input"
                type="date"
                value={formData.date}
                min={today}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            className="!bg-gray-900 hover:!bg-black !text-white !py-3 !px-8 !text-base !font-semibold !rounded-lg !shadow-md hover:!shadow-lg !transition-all"
            size="lg"
          >
            Search Vehicles
          </Button>
        </div>
      </form>
    </div>
  );
};
