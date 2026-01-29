"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { logout } from "@/lib/auth";
import { ConfirmLogoutModal } from "@/components/ui/ConfirmLogoutModal";

interface ProfileDropdownProps {
  user: User;
  onEditProfile: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onEditProfile,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
      >
        {user.profile_image_url && !imageError ? (
          <img
            src={user.profile_image_url}
            alt={user.name || "User"}
            className="w-10 h-10 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold">
            {getInitials(user.name)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <div className="flex items-center gap-3">
              {user.profile_image_url && !imageError ? (
                <img
                  src={user.profile_image_url}
                  alt={user.name || "User"}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.name || "User"}</p>
                <p className="text-sm text-blue-100">{user.mobile_number || ""}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                onEditProfile();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-gray-700">
                {user.is_owner_sub_user ? "Manage Profile" : "Edit Profile"}
              </span>
            </button>

            <button
              onClick={() => {
                router.push("/my-bookings");
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="text-gray-700">My Bookings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors text-red-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmLogoutModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />
    </div>
  );
};
