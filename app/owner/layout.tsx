"use client";

import { OwnerKYCProvider } from "@/contexts/OwnerKYCContext";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerKYCProvider>{children}</OwnerKYCProvider>;
}
