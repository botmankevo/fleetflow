"use client";

import { ReactNode } from "react";

interface StatCardEnhancedProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "indigo";
  onClick?: () => void;
}

export default function StatCardEnhanced({
  label,
  value,
  icon,
  trend,
  color = "blue",
  onClick,
}: StatCardEnhancedProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    green: "from-green-500 to-green-600 shadow-green-200",
    yellow: "from-yellow-500 to-yellow-600 shadow-yellow-200",
    red: "from-red-500 to-red-600 shadow-red-200",
    purple: "from-purple-500 to-purple-600 shadow-purple-200",
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-200",
  };

  const textColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover-lift transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {/* Gradient accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full -mr-16 -mt-16`}
      />

      <div className="relative">
        {/* Icon */}
        {icon && (
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg mb-4`}
          >
            {icon}
          </div>
        )}

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {trend && (
            <span
              className={`text-sm font-semibold ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {/* Label */}
        <p className={`text-sm font-medium ${textColorClasses[color]}`}>
          {label}
        </p>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}
