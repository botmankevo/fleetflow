"use client";

interface RatePerMileBadgeProps {
  ratePerMile: number;
  totalMiles?: number;
  rateAmount?: number;
  showDetails?: boolean;
}

export default function RatePerMileBadge({
  ratePerMile,
  totalMiles,
  rateAmount,
  showDetails = false,
}: RatePerMileBadgeProps) {
  const getColor = () => {
    if (ratePerMile >= 2.50) return "green";
    if (ratePerMile >= 1.50) return "yellow";
    return "red";
  };

  const getColorClasses = () => {
    const color = getColor();
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800 border-green-300";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "red":
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const getLabel = () => {
    const color = getColor();
    switch (color) {
      case "green":
        return "Excellent";
      case "yellow":
        return "Acceptable";
      case "red":
        return "Poor";
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border-2 ${getColorClasses()}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg font-bold">
          ${ratePerMile.toFixed(2)}/mi
        </span>
        <span className="text-xs font-semibold uppercase">
          {getLabel()}
        </span>
      </div>
      
      {showDetails && totalMiles && rateAmount && (
        <div className="text-xs opacity-75 border-l pl-2 ml-2">
          ${rateAmount.toLocaleString()} ÷ {totalMiles.toFixed(0)} mi
        </div>
      )}
    </div>
  );
}
