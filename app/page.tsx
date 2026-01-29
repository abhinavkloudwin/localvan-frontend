"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { BookingForm } from "@/components/booking/BookingForm";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import BecomePartnerModal from "@/components/owner/BecomePartnerModal";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isBecomePartnerOpen, setIsBecomePartnerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApprovedKYC, setHasApprovedKYC] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationPermissionDismissed, setLocationPermissionDismissed] = useState(false);

  const vehicleTypes = [
    "Sedan Cars",
    "SUV Vehicles",
    "Luxury Cars",
    "Minibus/Van",
    "Tempo Traveller",
    "Ambulance Services",
    "Commercial Vehicles",
    "Wedding Cars",
  ];

  const popularCities = [
    "Kochi",
    "Thiruvananthapuram",
    "Thrissur",
    "Kozhikode",
    "Kottayam",
    "Kollam",
    "Palakkad",
    "Alappuzha",
  ];

  const fetchUser = async () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        const userData = await apiClient.getProfile();

        // Redirect admin users to dashboard
        if (userData?.role === "admin") {
          router.push("/dashboard");
          return;
        }

        setUser(userData);

        // Check KYC status for owners
        if (userData?.role === "owner") {
          try {
            const kycResponse = await apiClient.getMyKYC();
            if (kycResponse?.data?.kyc_status === "approved") {
              setHasApprovedKYC(true);
            } else {
              setHasApprovedKYC(false);
            }
          } catch (error) {
            // KYC not found or error
            setHasApprovedKYC(false);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      apiClient.removeToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  // Check for location permission on mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      // Check if user has previously dismissed the prompt
      const dismissed = localStorage.getItem('locationPromptDismissed');
      if (dismissed === 'true') {
        setLocationPermissionDismissed(true);
        return;
      }

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        return;
      }

      // Check current permission state
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'prompt' || permission.state === 'denied') {
            setShowLocationPrompt(true);
          }
        } catch (error) {
          // If permissions API is not supported, show the prompt anyway
          setShowLocationPrompt(true);
        }
      } else {
        // Show prompt if permissions API not available
        setShowLocationPrompt(true);
      }
    };

    checkLocationPermission();
  }, []);

  const handleAuthSuccess = async () => {
    try {
      const userData = await apiClient.getProfile();
      setUser(userData);

      if (userData?.role === "owner") {
        try {
          const kycResponse = await apiClient.getMyKYC();
          setHasApprovedKYC(kycResponse?.data?.kyc_status === "approved");
        } catch (error) {
          setHasApprovedKYC(false);
        }
      } else {
        setHasApprovedKYC(false);
      }
    } catch (error) {
      console.error("Failed to fetch user after auth:", error);
    }
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleEnableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.success("Location enabled successfully!");
          setShowLocationPrompt(false);
          localStorage.setItem('locationPromptDismissed', 'true');
          setLocationPermissionDismissed(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Location permission denied. Please enable it in your browser settings.");
          } else {
            toast.error("Failed to get location. Please try again.");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleDismissLocationPrompt = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('locationPromptDismissed', 'true');
    setLocationPermissionDismissed(true);
  };

  const handleSearch = (searchFormData: any) => {
    // Validate pickup location
    if (!searchFormData.pickupLocation) {
      toast.error("Please select a pickup location");
      return;
    }

    // Validate date is required
    if (!searchFormData.date) {
      toast.error("Please select a pickup date");
      return;
    }

    // Validate time is required
    if (!searchFormData.time) {
      toast.error("Please select a pickup time");
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(searchFormData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error("Pickup date cannot be in the past");
      return;
    }

    // If date is today, validate time is not in the past
    if (selectedDate.toDateString() === today.toDateString()) {
      const [hours, minutes] = searchFormData.time.split(":").map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      if (selectedTime < now) {
        toast.error("Pickup time cannot be in the past");
        return;
      }
    }

    // Build URL params for search-vehicles page
    const params = new URLSearchParams({
      pickup: searchFormData.pickupLocation.address,
      drop: searchFormData.dropoffLocation?.address || "",
      date: searchFormData.date || "",
      time: searchFormData.time || "",
      lat: searchFormData.pickupLocation.latitude.toString(),
      lng: searchFormData.pickupLocation.longitude.toString(),
      dropLat: searchFormData.dropoffLocation?.latitude?.toString() || "0",
      dropLng: searchFormData.dropoffLocation?.longitude?.toString() || "0",
    });

    // Navigate to search results page
    router.push(`/search-vehicles?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => router.push("/")}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => {
                  // Scroll to the booking form section and show toast
                  const mainElement = document.querySelector('main');
                  if (mainElement) {
                    mainElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Show toast after a short delay so user sees the form
                    setTimeout(() => {
                      toast.success("Please fill in your booking details below");
                    }, 500);
                  }
                }}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Book Vehicles
              </button>
              <button
                onClick={() => router.push("/how-it-works")}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                How it Works
              </button>
              <button
                onClick={() => router.push("/contact")}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Contact
              </button>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              {!loading && (
                <Button
                  onClick={() => {
                    // For sub-owners or owners with approved KYC, go to dashboard
                    if (user?.role === "owner" && (hasApprovedKYC || user?.is_owner_sub_user)) {
                      router.push("/owner/dashboard");
                    } else if (user?.role === "driver") {
                      router.push("/driver/dashboard");
                    } else {
                      setIsBecomePartnerOpen(true);
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="sm:!px-4 sm:!py-2.5 cursor-pointer"
                >
                  {user?.role === "owner" ? (
                    <>
                      <span className="hidden sm:inline">Manage Company Profile</span>
                      <span className="sm:hidden">Company</span>
                    </>
                  ) : user?.role === "driver" ? (
                    <>
                      <span className="hidden sm:inline">Manage Bookings</span>
                      <span className="sm:hidden">Bookings</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Become a Partner</span>
                      <span className="sm:hidden">Partner</span>
                    </>
                  )}
                </Button>
              )}
              {loading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              ) : user ? (
                <ProfileDropdown
                  user={user}
                  onEditProfile={() => {
                    // Redirect sub-owners to dashboard instead of edit profile
                    if (user.is_owner_sub_user) {
                      router.push("/owner/dashboard");
                    } else {
                      setIsEditProfileOpen(true);
                    }
                  }}
                />
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)} size="sm" className="sm:!px-5 sm:!py-2.5">
                  <span className="hidden sm:inline">Login or Create Account</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Location Permission Prompt Banner */}
      {showLocationPrompt && !locationPermissionDismissed && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 shadow-lg relative z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-medium">
                  Enable location for better experience
                </p>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                  Get faster bookings and find vehicles near you
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnableLocation}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Enable
              </button>
              <button
                onClick={handleDismissLocationPrompt}
                className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Background */}
      <main
        className="flex-1 relative min-h-[calc(100vh-200px)] flex items-center justify-center"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/60 to-gray-900/70"></div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Explore Kerala with Premium Vehicles
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Find the perfect vehicle for your journey. Smart choices for comfortable rides.
          </p>

          {/* Booking Form */}
          <div className="max-w-4xl mx-auto">
            <BookingForm onSearch={handleSearch} />
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-10">
          {/* All Sections in One Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 mb-8 max-w-7xl mx-auto">
            {/* LocalVan */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">LocalVan</h3>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                Your trusted partner for premium vehicle rentals across Kerala.
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91 75111 77227</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="break-all">support@localvan.in</span>
                </div>
                <div className="flex items-start gap-1.5 text-gray-400 text-xs mt-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="leading-relaxed">
                    <p className="font-semibold text-white">INFYSAINT AI SOLUTIONS</p>
                    <p>Suite No. B29, Door No. 63/700</p>
                    <p>D Space, 6th Floor, Sky Tower</p>
                    <p>Mavoor Road Junction</p>
                    <p>Bank Road, Kozhikode – 673001</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Quick Links</h3>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => router.push("/about")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/faq")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    FAQs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/blogs")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Blogs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (user?.role === "owner" && (hasApprovedKYC || user?.is_owner_sub_user)) {
                        router.push("/owner/dashboard");
                      } else {
                        setIsBecomePartnerOpen(true);
                      }
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    {user?.role === "owner" ? "Manage Company Profile" : "Become a Partner"}
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                    Careers
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/contact")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Policies</h3>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => router.push("/privacy")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/terms")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/refund")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Refund Policy
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                    Cancellation Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Vehicle Types */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Vehicle Types</h3>
              <ul className="space-y-1.5">
                {vehicleTypes.map((vehicle) => (
                  <li key={vehicle}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                      {vehicle}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Locations */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Popular Cities</h3>
              <ul className="space-y-1.5">
                {popularCities.map((city) => (
                  <li key={city}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                      {city}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Media & Copyright */}
          <div className="border-t border-gray-800 pt-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-xs sm:text-sm">
                © 2025 Infysaint AI Solutions. All rights reserved.
              </p>
              <div className="flex gap-4">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* Twitter */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-500 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {user && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={user}
          onSuccess={handleProfileUpdate}
        />
      )}

      <BecomePartnerModal
        isOpen={isBecomePartnerOpen}
        onClose={() => setIsBecomePartnerOpen(false)}
        onUserUpdate={fetchUser}
      />
    </div>
  );
}
