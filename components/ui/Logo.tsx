import React from "react";
import Image from "next/image";

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center cursor-pointer ${className}`}>
      <Image
        src="/Local-van-logo.png"
        alt="Local Van Logo"
        width={280}
        height={90}
        className="h-20 sm:h-24 md:h-22 w-auto object-contain -my-5 sm:-my-7 md:-my-9"
        priority
      />
    </div>
  );
};
