"use client";

import { useState, useEffect } from "react";
import { loadboardsApi } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, TrendingUp, MapPin, Calendar, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";

export default function LoadBoardsPage() {
  const [loading, setLoading] = useState(false);
  const [loads, setLoads] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [searchCriteria, setSearchCriteria] = useState({
    origin_city: "",
    origin_state: "",
    origin_radius: "100",
    destination_city: "",
    destination_state: "",
    destination_radius: "100",
    equipment_type: "VAN",
    pickup_date_start: "",
    pickup_date_end: "",
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await loadboardsApi.getStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to load status");
    }
  };

  const handleSearch = async (source: "all" | "dat" | "truckstop") => {
    try {
      setLoading(true);
      let data;
      
      if (source === "all") {
        data = await loadboardsApi.searchAll(searchCriteria);
      } else if (source === "dat") {
        data = await loadboardsApi.searchDAT(searchCriteria);
      } else {
        data = await loadboardsApi.searchTruckStop(searchCriteria);
      }
      
      setLoads(data || []);
      toast.success(`Found ${data?.length || 0} loads`);
    } catch (error: any) {
      toast.error("Failed to search load boards");
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportLoad = async (load: any) => {
    try {
      await loadboardsApi.importLoad(load.id, load.source, load);
      toast.success("Load imported successfully!");
    } catch (error: any) {
      toast.error("Failed to import load");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSearchCriteria((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Load Boards</h1>
          <p className="text-muted-foreground mt-2">
            Search for available loads on DAT and TruckStop
          </p>
        </div>
        <div className="flex gap-2">
          {status?.dat?.configured && (
            <Badge variant="default">DAT Connected</Badge>
          )}
          {status?.truckstop?.configured && (
            <Badge variant="default">TruckStop Connected</Badge>
          )}
        </div>
      </div>

      {/* Search Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Find loads matching your criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Origin */}
            <div>
              <Label>Origin City</Label>
              <Input
                placeholder="e.g., Dallas"
                value={searchCriteria.origin_city}
                onChange={(e) => handleInputChange("origin_city", e.target.value)}
              />
            </div>
            <div>
              <Label>Origin State</Label>
              <Input
                placeholder="e.g., TX"
                maxLength={2}
                value={searchCriteria.origin_state}
                onChange={(e) => handleInputChange("origin_state", e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label>Origin Radius (miles)</Label>
              <Select
                value={searchCriteria.origin_radius}
                onValueChange={(value) => handleInputChange("origin_radius", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                  <SelectItem value="150">150 miles</SelectItem>
                  <SelectItem value="200">200 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div>
              <Label>Destination City</Label>
              <Input
                placeholder="e.g., Los Angeles"
                value={searchCriteria.destination_city}
                onChange={(e) => handleInputChange("destination_city", e.target.value)}
              />
            </div>
            <div>
              <Label>Destination State</Label>
              <Input
                placeholder="e.g., CA"
                maxLength={2}
                value={searchCriteria.destination_state}
                onChange={(e) => handleInputChange("destination_state", e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label>Destination Radius (miles)</Label>
              <Select
                value={searchCriteria.destination_radius}
                onValueChange={(value) => handleInputChange("destination_radius", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                  <SelectItem value="150">150 miles</SelectItem>
                  <SelectItem value="200">200 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipment & Dates */}
            <div>
              <Label>Equipment Type</Label>
              <Select
                value={searchCriteria.equipment_type}
                onValueChange={(value) => handleInputChange("equipment_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAN">Dry Van</SelectItem>
                  <SelectItem value="REEFER">Reefer</SelectItem>
                  <SelectItem value="FLATBED">Flatbed</SelectItem>
                  <SelectItem value="STEPDECK">Step Deck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pickup Start Date</Label>
              <Input
                type="date"
                value={searchCriteria.pickup_date_start}
                onChange={(e) => handleInputChange("pickup_date_start", e.target.value)}
              />
            </div>
            <div>
              <Label>Pickup End Date</Label>
              <Input
                type="date"
                value={searchCriteria.pickup_date_end}
                onChange={(e) => handleInputChange("pickup_date_end", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => handleSearch("all")}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search All Load Boards
            </Button>
            {status?.dat?.configured && (
              <Button
                onClick={() => handleSearch("dat")}
                disabled={loading}
                variant="outline"
              >
                Search DAT Only
              </Button>
            )}
            {status?.truckstop?.configured && (
              <Button
                onClick={() => handleSearch("truckstop")}
                disabled={loading}
                variant="outline"
              >
                Search TruckStop Only
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({loads.length} loads)</CardTitle>
            <CardDescription>
              Click on a load to view details or import into MainTMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loads.map((load, idx) => (
                <Card key={idx} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={load.source === "dat" ? "default" : "secondary"}>
                            {load.source.toUpperCase()}
                          </Badge>
                          {load.load_number && (
                            <span className="text-sm font-mono text-muted-foreground">
                              #{load.load_number}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Origin</p>
                              <p className="text-sm text-muted-foreground">
                                {load.origin_city}, {load.origin_state}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Destination</p>
                              <p className="text-sm text-muted-foreground">
                                {load.destination_city}, {load.destination_state}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Pickup Date</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(load.pickup_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {load.rate && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-semibold">${load.rate.toLocaleString()}</span>
                            </div>
                          )}
                          {load.distance && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>{load.distance} mi</span>
                              {load.rate && load.distance && (
                                <span className="text-muted-foreground">
                                  (${(load.rate / load.distance).toFixed(2)}/mi)
                                </span>
                              )}
                            </div>
                          )}
                          {load.equipment_type && (
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{load.equipment_type}</span>
                            </div>
                          )}
                        </div>

                        {load.broker_name && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Broker:</span>{" "}
                            <span className="font-medium">{load.broker_name}</span>
                            {load.broker_mc && (
                              <span className="text-muted-foreground ml-2">
                                (MC# {load.broker_mc})
                              </span>
                            )}
                          </div>
                        )}

                        {load.comments && (
                          <p className="text-sm text-muted-foreground italic">
                            {load.comments}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={() => handleImportLoad(load)}
                        size="sm"
                        variant="default"
                      >
                        Import Load
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!loading && loads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No loads found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check if load boards are configured
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Notice */}
      {!status?.dat?.configured && !status?.truckstop?.configured && (
        <Card>
          <CardContent className="py-8">
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Notice:</strong> No load boards are configured. Please contact your
                administrator to set up DAT and/or TruckStop API credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
