"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          <div className="mb-6">
            <div className="text-8xl font-bold text-blue-500 mb-4">404</div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
              Page Not Found
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              The route you are looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full sm:w-auto px-6"
            >
              Go Back
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="w-full sm:w-auto px-6"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
