"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Driver {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  documents?: any[];
  cdl_expiry?: string;
  medical_card_expiry?: string;
}

interface DocumentStatus {
  total: number;
  active: number;
  expired: number;
  expiring_soon: number;
  missing: number;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "compliant" | "expiring" | "non-compliant">("all");

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const data = await apiFetch("/drivers/");
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDriverDocStatus = (driver: Driver): DocumentStatus => {
    const REQUIRED_DOCS = ["CDL", "Medical Card", "Drug Test", "MVR", "Application"];
    const docs = driver.documents || [];
    
    let expired = 0;
    let expiring_soon = 0;
    let active = 0;
    let missing = 0;

    // Check CDL
    if (driver.cdl_expiry) {
      const daysUntil = Math.floor((new Date(driver.cdl_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) expired++;
      else if (daysUntil <= 30) expiring_soon++;
      else active++;
    } else {
      missing++;
    }

    // Check Medical Card
    if (driver.medical_card_expiry) {
      const daysUntil = Math.floor((new Date(driver.medical_card_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) expired++;
      else if (daysUntil <= 30) expiring_soon++;
      else active++;
    } else {
      missing++;
    }

    // Check other docs
    REQUIRED_DOCS.slice(2).forEach(docType => {
      const doc = docs.find(d => d.doc_type === docType);
      if (!doc) {
        missing++;
      } else if (doc.expires_at) {
        const daysUntil = Math.floor((new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) expired++;
        else if (daysUntil <= 30) expiring_soon++;
        else active++;
      } else {
        active++;
      }
    });

    return {
      total: REQUIRED_DOCS.length,
      active,
      expired,
      expiring_soon,
      missing
    };
  };

  const getComplianceStatus = (docStatus: DocumentStatus) => {
    if (docStatus.expired > 0) return "non-compliant";
    if (docStatus.expiring_soon > 0 || docStatus.missing > 0) return "expiring";
    return "compliant";
  };

  const filteredDrivers = drivers.filter(driver => {
    if (filter === "all") return true;
    const docStatus = getDriverDocStatus(driver);
    const status = getComplianceStatus(docStatus);
    return status === filter;
  });

  const stats = {
    total: drivers.length,
    compliant: drivers.filter(d => getComplianceStatus(getDriverDocStatus(d)) === "compliant").length,
    expiring: drivers.filter(d => getComplianceStatus(getDriverDocStatus(d)) === "expiring").length,
    nonCompliant: drivers.filter(d => getComplianceStatus(getDriverDocStatus(d)) === "non-compliant").length,
  };

  if (loading) {
    return (
      <main className="p-8 bg-background min-h-screen">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading drivers...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 bg-background min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Drivers</h1>
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg">
          + Add Driver
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="Total Drivers"
          value={stats.total.toString()}
          color="primary"
          onClick={() => setFilter("all")}
          active={filter === "all"}
        />
        <StatCard
          icon="✅"
          label="Compliant"
          value={stats.compliant.toString()}
          color="success"
          onClick={() => setFilter("compliant")}
          active={filter === "compliant"}
        />
        <StatCard
          icon="⚠️"
          label="Expiring Soon"
          value={stats.expiring.toString()}
          color="warning"
          onClick={() => setFilter("expiring")}
          active={filter === "expiring"}
        />
        <StatCard
          icon="❌"
          label="Non-Compliant"
          value={stats.nonCompliant.toString()}
          color="destructive"
          onClick={() => setFilter("non-compliant")}
          active={filter === "non-compliant"}
        />
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map(driver => (
          <DriverCard key={driver.id} driver={driver} docStatus={getDriverDocStatus(driver)} />
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-20 bg-card rounded-xl border">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No drivers found</h3>
          <p className="text-muted-foreground">
            {filter !== "all" ? `No ${filter} drivers` : "Add your first driver to get started"}
          </p>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, label, value, color, onClick, active }: any) {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
        active ? colors[color as keyof typeof colors] + " ring-2 ring-offset-2 ring-" + color : "bg-card border hover:border-primary/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-semibold opacity-75">{label}</p>
    </button>
  );
}

function DriverCard({ driver, docStatus }: { driver: Driver; docStatus: DocumentStatus }) {
  const name = driver.name || `${driver.first_name || ""} ${driver.last_name || ""}`.trim() || "Unknown Driver";
  const complianceStatus = docStatus.expired > 0 ? "non-compliant" : docStatus.expiring_soon > 0 || docStatus.missing > 0 ? "expiring" : "compliant";

  const statusColors = {
    compliant: "bg-success/10 text-success border-success/20",
    expiring: "bg-warning/10 text-warning border-warning/20",
    "non-compliant": "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusIcons = {
    compliant: "✅",
    expiring: "⚠️",
    "non-compliant": "❌",
  };

  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{driver.email || "No email"}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[complianceStatus]}`}>
          {statusIcons[complianceStatus]} {complianceStatus.replace("-", " ").toUpperCase()}
        </span>
      </div>

      {/* Document Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Documents:</span>
          <span className="font-semibold text-foreground">
            {docStatus.active + docStatus.expiring_soon}/{docStatus.total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div className="h-full flex">
            {docStatus.active > 0 && (
              <div className="bg-success" style={{ width: `${(docStatus.active / docStatus.total) * 100}%` }} />
            )}
            {docStatus.expiring_soon > 0 && (
              <div className="bg-warning" style={{ width: `${(docStatus.expiring_soon / docStatus.total) * 100}%` }} />
            )}
            {docStatus.expired > 0 && (
              <div className="bg-destructive" style={{ width: `${(docStatus.expired / docStatus.total) * 100}%` }} />
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {docStatus.active > 0 && (
            <div className="text-center">
              <div className="font-bold text-success">{docStatus.active}</div>
              <div className="text-muted-foreground">Active</div>
            </div>
          )}
          {docStatus.expiring_soon > 0 && (
            <div className="text-center">
              <div className="font-bold text-warning">{docStatus.expiring_soon}</div>
              <div className="text-muted-foreground">Expiring</div>
            </div>
          )}
          {docStatus.expired > 0 && (
            <div className="text-center">
              <div className="font-bold text-destructive">{docStatus.expired}</div>
              <div className="text-muted-foreground">Expired</div>
            </div>
          )}
          {docStatus.missing > 0 && (
            <div className="text-center">
              <div className="font-bold text-muted-foreground">{docStatus.missing}</div>
              <div className="text-muted-foreground">Missing</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t">
        <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold">
          View Details
        </button>
        {complianceStatus !== "compliant" && (
          <button className="px-3 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-colors text-sm font-semibold">
            Update Docs
          </button>
        )}
      </div>
    </div>
  );
}
