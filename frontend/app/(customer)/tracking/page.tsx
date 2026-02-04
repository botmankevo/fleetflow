"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, Clock, CheckCircle2, Truck, Calendar, Phone, Mail } from "lucide-react";
import { cn } from "../../../lib/utils";

type LoadStatus = "Created" | "Assigned" | "In Transit" | "Delivered";

type Load = {
  id: number;
  load_number: string;
  status: LoadStatus;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string;
  delivery_date: string;
  progress_percentage: number;
  estimated_delivery: string;
};

export default function CustomerTrackingPortal() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Demo data
  useEffect(() => {
    const demoLoads: Load[] = [
      {
        id: 1,
        load_number: "LOAD-2024-001",
        status: "In Transit",
        pickup_address: "123 Main St, Los Angeles, CA 90001",
        delivery_address: "456 Oak Ave, New York, NY 10001",
        pickup_date: "2024-02-01",
        delivery_date: "2024-02-05",
        progress_percentage: 60,
        estimated_delivery: "2024-02-05T14:00:00",
      },
      {
        id: 2,
        load_number: "LOAD-2024-002",
        status: "Delivered",
        pickup_address: "789 Pine St, Chicago, IL 60601",
        delivery_address: "321 Elm St, Miami, FL 33101",
        pickup_date: "2024-01-28",
        delivery_date: "2024-02-01",
        progress_percentage: 100,
        estimated_delivery: "2024-02-01T10:30:00",
      },
    ];
    setLoads(demoLoads);
    if (demoLoads.length > 0) {
      setSelectedLoad(demoLoads[0]);
    }
  }, []);

  const getStatusColor = (status: LoadStatus) => {
    switch (status) {
      case "Delivered":
        return "bg-accent/20 text-accent border-accent/30";
      case "In Transit":
        return "bg-primary/20 text-primary border-primary/30";
      case "Assigned":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      default:
        return "bg-muted text-muted-foreground border-glass-border";
    }
  };

  const getStatusSteps = (status: LoadStatus) => {
    const steps = [
      { label: "Created", icon: Package, completed: true },
      { label: "Assigned", icon: Truck, completed: status !== "Created" },
      { label: "In Transit", icon: MapPin, completed: status === "In Transit" || status === "Delivered" },
      { label: "Delivered", icon: CheckCircle2, completed: status === "Delivered" },
    ];
    return steps;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="border-b border-glass-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg-main flex items-center justify-center">
                <span className="ai-text text-white text-sm">TMS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Customer Portal</h1>
                <p className="text-xs text-muted-foreground">Track your shipments</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Support</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loads List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="ai-card p-4">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Your Shipments
              </h2>
              
              <input
                type="text"
                placeholder="Search by load number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-secondary border border-glass-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-4"
              />

              <div className="space-y-2">
                {loads.map((load) => (
                  <button
                    key={load.id}
                    onClick={() => setSelectedLoad(load)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 transition-all text-left",
                      selectedLoad?.id === load.id
                        ? "border-primary bg-primary/10"
                        : "border-glass-border bg-secondary/30 hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground ai-text">{load.load_number}</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border font-medium",
                          getStatusColor(load.status)
                        )}
                      >
                        {load.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        {load.delivery_address.split(",")[1]}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA: {new Date(load.estimated_delivery).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="ai-card p-4 space-y-3">
              <h3 className="font-bold text-foreground text-sm">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Shipments</span>
                  <span className="text-lg font-bold ai-text text-foreground">{loads.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Transit</span>
                  <span className="text-lg font-bold ai-text text-primary">
                    {loads.filter((l) => l.status === "In Transit").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">On-Time Rate</span>
                  <span className="text-lg font-bold ai-text text-accent">94.5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Load Details */}
          <div className="lg:col-span-2">
            {selectedLoad ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="ai-card p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold ai-heading">{selectedLoad.load_number}</h2>
                      <p className="text-muted-foreground text-sm mt-1">Tracking Details</p>
                    </div>
                    <span
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 font-bold",
                        getStatusColor(selectedLoad.status)
                      )}
                    >
                      {selectedLoad.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-bg-main transition-all duration-500"
                        style={{ width: `${selectedLoad.progress_percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-bold text-primary">{selectedLoad.progress_percentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="ai-card p-6">
                  <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Shipment Timeline
                  </h3>
                  <div className="space-y-4">
                    {getStatusSteps(selectedLoad.status).map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                              step.completed
                                ? "bg-primary border-primary text-white"
                                : "bg-secondary border-glass-border text-muted-foreground"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className={cn("font-medium", step.completed ? "text-foreground" : "text-muted-foreground")}>
                              {step.label}
                            </p>
                            {step.completed && (
                              <p className="text-xs text-muted-foreground">
                                {idx === 0 ? selectedLoad.pickup_date : idx === 3 && selectedLoad.status === "Delivered" ? selectedLoad.delivery_date : "In Progress"}
                              </p>
                            )}
                          </div>
                          {step.completed && (
                            <CheckCircle2 className="w-5 h-5 text-accent" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Route Details */}
                <div className="ai-card p-6">
                  <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Route Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                        <div className="w-3 h-3 rounded-full bg-accent pulse-glow-accent"></div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Pickup Location</p>
                        <p className="text-sm font-medium text-foreground">{selectedLoad.pickup_address}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(selectedLoad.pickup_date).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Delivery Location</p>
                        <p className="text-sm font-medium text-foreground">{selectedLoad.delivery_address}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expected: {new Date(selectedLoad.delivery_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Support */}
                <div className="ai-card p-6 gradient-bg-main text-white">
                  <h3 className="font-bold mb-4">Need Help?</h3>
                  <p className="text-sm text-white/80 mb-4">
                    Our support team is available 24/7 to assist you with any questions.
                  </p>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Call Us
                    </button>
                    <button className="flex-1 py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-medium flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ai-card p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a shipment to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
