"use client";

import { useState, useEffect } from "react";
import { motiveApi, driversApi } from "@/lib/api-services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [hosData, setHosData] = useState<any>(null);

  useEffect(() => {
    loadStatus();
    loadLocations();
    // Refresh every 30 seconds
    const interval = setInterval(loadLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await motiveApi.getStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to load Motive status");
    }
  };

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await motiveApi.getAllDriverLocations();
      setLocations(data || []);
    } catch (error: any) {
      console.error("Failed to load locations");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHOSData = async (driverId: number) => {
    try {
      const data = await motiveApi.getHOSStatus(driverId);
      setHosData(data);
    } catch (error: any) {
      toast.error("Failed to load HOS data");
    }
  };

  const handleDriverClick = async (location: any) => {
    setSelectedDriver(location);
    await loadHOSData(location.driver_id);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "driving":
        return "bg-green-500";
      case "on_duty":
        return "bg-blue-500";
      case "off_duty":
        return "bg-gray-500";
      case "sleeper_berth":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "driving":
        return "Driving";
      case "on_duty":
        return "On Duty";
      case "off_duty":
        return "Off Duty";
      case "sleeper_berth":
        return "Sleeper Berth";
      default:
        return status || "Unknown";
    }
  };

  if (!status?.connected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Motive ELD Not Connected</h3>
            <p className="text-muted-foreground">
              Please configure Motive API credentials to enable live tracking
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Real-time GPS tracking and Hours of Service monitoring via Motive ELD
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {status?.company_name || "Connected"}
          </Badge>
          <Button onClick={loadLocations} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver List */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Active Drivers ({locations.length})</CardTitle>
              <CardDescription>
                Click on a driver to view detailed HOS information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && locations.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active drivers found
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.map((location) => (
                    <Card
                      key={location.driver_id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleDriverClick(location)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{location.driver_name}</h3>
                              {hosData?.driver_id === location.driver_id && (
                                <Badge className={getStatusColor(hosData.status)}>
                                  {getStatusLabel(hosData.status)}
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Navigation className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {location.speed.toFixed(0)} mph
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Last updated: {new Date(location.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* HOS Details Sidebar */}
        <div className="space-y-3">
          {selectedDriver ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedDriver.driver_name}</CardTitle>
                  <CardDescription>Current Location & Status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="text-sm">
                      {selectedDriver.address || "Address unavailable"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Speed</p>
                      <p className="text-lg font-semibold">
                        {selectedDriver.speed.toFixed(0)} mph
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Heading</p>
                      <p className="text-lg font-semibold">
                        {selectedDriver.heading ? `${selectedDriver.heading}°` : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
                    <p className="text-xs font-mono">
                      {selectedDriver.latitude.toFixed(6)}, {selectedDriver.longitude.toFixed(6)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {hosData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Hours of Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                      <Badge className={getStatusColor(hosData.status)} variant="default">
                        {getStatusLabel(hosData.status)}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Driving Hours</span>
                        <span className="font-medium">
                          {hosData.driving_hours_remaining.toFixed(1)}h left
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(hosData.driving_hours_remaining / 11) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Shift Hours</span>
                        <span className="font-medium">
                          {hosData.shift_hours_remaining.toFixed(1)}h left
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(hosData.shift_hours_remaining / 14) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Cycle Hours</span>
                        <span className="font-medium">
                          {hosData.cycle_hours_remaining.toFixed(1)}h left
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(hosData.cycle_hours_remaining / 70) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {hosData.time_until_break && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Break Required:</strong> {hosData.time_until_break} minutes
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2">
                      Last updated: {new Date(hosData.last_updated).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a driver to view detailed tracking information
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
