"use client";

import { useEffect, useState } from "react";
import MapboxMap from "@/components/maps/MapboxMap";
import RatePerMileBadge from "./RatePerMileBadge";
import { apiFetch } from "@/lib/api";

interface LoadStop {
  id: number;
  stop_type: string;
  stop_number: number;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  date?: string;
  time?: string;
  miles_to_next_stop?: number;
  latitude?: number;
  longitude?: number;
}

interface LoadStopsMapProps {
  stops: LoadStop[];
  rateAmount?: number;
  totalMiles?: number;
  showRouteCalculation?: boolean;
}

export default function LoadStopsMap({
  stops,
  rateAmount,
  totalMiles,
  showRouteCalculation = true,
}: LoadStopsMapProps) {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Calculate route if addresses are provided
  useEffect(() => {
    if (!showRouteCalculation || stops.length < 2) return;

    const addresses = stops
      .sort((a, b) => a.stop_number - b.stop_number)
      .map((stop) => stop.address || `${stop.city}, ${stop.state}`)
      .filter(Boolean);

    if (addresses.length < 2) return;

    const calculateRoute = async () => {
      try {
        setLoading(true);
        const response = await apiFetch("/mapbox/route", {
          method: "POST",
          body: JSON.stringify({ addresses }),
        });
        setRouteData(response);
      } catch (error) {
        console.error("Failed to calculate route:", error);
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [stops, showRouteCalculation]);

  // Prepare markers for map
  const markers = stops
    .sort((a, b) => a.stop_number - b.stop_number)
    .filter((stop) => stop.latitude && stop.longitude)
    .map((stop, index) => ({
      coordinates: [stop.longitude!, stop.latitude!] as [number, number],
      label: `${stop.stop_type === "pickup" ? "Pickup" : "Delivery"} #${stop.stop_number}: ${stop.company || stop.city}`,
      color: stop.stop_type === "pickup" ? "#3b82f6" : "#10b981",
    }));

  const calculatedMiles = routeData?.total_distance_miles || totalMiles;
  const ratePerMile = rateAmount && calculatedMiles ? rateAmount / calculatedMiles : 0;

  return (
    <div className="space-y-4">
      {/* Rate Summary */}
      {rateAmount && calculatedMiles && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Load Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              ${rateAmount.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm text-gray-600">Total Miles</p>
            <p className="text-2xl font-bold text-gray-900">
              {calculatedMiles.toFixed(0)} mi
            </p>
          </div>
          <div>
            <RatePerMileBadge
              ratePerMile={ratePerMile}
              totalMiles={calculatedMiles}
              rateAmount={rateAmount}
              showDetails={true}
            />
          </div>
        </div>
      )}

      {/* Map */}
      {markers.length > 0 && (
        <div className="relative">
          {loading && (
            <div className="absolute top-4 right-4 z-10 bg-white px-3 py-2 rounded-lg shadow-md">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                <span className="text-sm">Calculating route...</span>
              </div>
            </div>
          )}
          <MapboxMap
            markers={markers}
            routes={routeData}
            height="500px"
            className="shadow-lg"
          />
        </div>
      )}

      {/* Stop Details */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Stops</h3>
        {stops
          .sort((a, b) => a.stop_number - b.stop_number)
          .map((stop, index) => {
            const leg = routeData?.legs?.[index];
            const milesFromPrevious = leg?.distance_miles || stop.miles_to_next_stop;

            return (
              <div
                key={stop.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          stop.stop_type === "pickup"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {stop.stop_type === "pickup" ? "📦 Pickup" : "🚚 Delivery"} #{stop.stop_number}
                      </span>
                      {milesFromPrevious && index < stops.length - 1 && (
                        <span className="text-sm text-gray-500">
                          → {milesFromPrevious.toFixed(0)} mi to next stop
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-gray-900">{stop.company || "Unknown Company"}</h4>
                    <p className="text-sm text-gray-600">
                      {stop.address || `${stop.city}, ${stop.state}`}
                    </p>
                    
                    {(stop.date || stop.time) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {stop.date} {stop.time && `at ${stop.time}`}
                      </p>
                    )}
                  </div>

                  {stop.latitude && stop.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Navigate
                    </a>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Route Summary */}
      {routeData && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Route Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Total Distance</p>
              <p className="text-lg font-bold text-blue-900">
                {routeData.total_distance_miles.toFixed(0)} miles
              </p>
            </div>
            <div>
              <p className="text-blue-700">Estimated Duration</p>
              <p className="text-lg font-bold text-blue-900">
                {routeData.total_duration_hours.toFixed(1)} hours
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
