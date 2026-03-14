"use client";

import Image from "next/image";

interface MainTMSLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const MainTMSLogo = ({ className, width = 120, height = 40 }: MainTMSLogoProps) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Image
        src="/logo.jpeg"
        alt="MAIN TMS Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
};
