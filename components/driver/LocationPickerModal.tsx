"use client";

import React, { useEffect, useRef, useState } from "react";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onLocationSelect,
  initialLat = 12.9716,
  initialLng = 77.5946,
}: LocationPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: selectedLat, lng: selectedLng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const markerInstance = new google.maps.Marker({
        position: { lat: selectedLat, lng: selectedLng },
        map: mapInstance,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      // Update location when marker is dragged
      markerInstance.addListener("dragend", () => {
        const position = markerInstance.getPosition();
        if (position) {
          setSelectedLat(position.lat());
          setSelectedLng(position.lng());
          reverseGeocode(position.lat(), position.lng());
        }
      });

      // Update location when map is clicked
      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setSelectedLat(lat);
          setSelectedLng(lng);
          markerInstance.setPosition(e.latLng);
          reverseGeocode(lat, lng);
        }
      });

      // Initialize Places Autocomplete
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ["geometry", "formatted_address"],
          componentRestrictions: { country: "in" },
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setSelectedLat(lat);
            setSelectedLng(lng);
            setSelectedAddress(place.formatted_address || "");
            mapInstance.setCenter({ lat, lng });
            markerInstance.setPosition({ lat, lng });
          }
        });
      }

      setMap(mapInstance);
      setMarker(markerInstance);
      setIsLoading(false);

      // Get initial address
      reverseGeocode(selectedLat, selectedLng);
    };

    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat, lng },
        });

        if (response.results[0]) {
          setSelectedAddress(response.results[0].formatted_address);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    };

    loadGoogleMaps();
  }, [isOpen]);

  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedLat(lat);
          setSelectedLng(lng);
          if (map) {
            map.setCenter({ lat, lng });
          }
          if (marker) {
            marker.setPosition({ lat, lng });
          }
          reverseGeocode(lat, lng);
          setUseCurrentLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Failed to get current location. Please enable location access.");
          setUseCurrentLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setUseCurrentLocation(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      if (window.google && window.google.maps) {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat, lng },
        });

        if (response.results[0]) {
          setSelectedAddress(response.results[0].formatted_address);
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLat, selectedLng, selectedAddress);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600">
          <h2 className="text-xl font-bold text-white">Select Your Location</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleUseCurrentLocation}
              disabled={useCurrentLocation}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {useCurrentLocation ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Getting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Current</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Search for an address, drag the marker, or click on the map to select your location
          </p>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full min-h-[400px]"></div>
        </div>

        {/* Selected Location Info */}
        {selectedAddress && (
          <div className="p-4 bg-emerald-50 border-t border-emerald-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-900 mb-1">Selected Location:</p>
                <p className="text-sm text-emerald-700">{selectedAddress}</p>
                <p className="text-xs text-emerald-600 mt-1 font-mono">
                  {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors font-semibold shadow-lg"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
