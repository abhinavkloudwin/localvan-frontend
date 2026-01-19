"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">401</h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
              Unauthorized Access
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              You do not have permission to access this page.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <Button onClick={() => router.push("/")} className="w-auto px-8">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
