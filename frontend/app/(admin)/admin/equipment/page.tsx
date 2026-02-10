"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Equipment {
  id: number;
  unit_number: string;
  type: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  status?: string;
  registration_expiry?: string;
  inspection_expiry?: string;
  insurance_expiry?: string;
}

interface EquipmentDocStatus {
  total: number;
  active: number;
  expired: number;
  expiring_soon: number;
  missing: number;
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "compliant" | "expiring" | "non-compliant">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "truck" | "trailer">("all");

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await apiFetch("/equipment/");
      setEquipment(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentDocStatus = (item: Equipment): EquipmentDocStatus => {
    const REQUIRED_DOCS = ["registration", "inspection", "insurance"];
    let expired = 0;
    let expiring_soon = 0;
    let active = 0;
    let missing = 0;

    // Check Registration
    if (item.registration_expiry) {
      const daysUntil = Math.floor((new Date(item.registration_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) expired++;
      else if (daysUntil <= 30) expiring_soon++;
      else active++;
    } else {
      missing++;
    }

    // Check Inspection
    if (item.inspection_expiry) {
      const daysUntil = Math.floor((new Date(item.inspection_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) expired++;
      else if (daysUntil <= 30) expiring_soon++;
      else active++;
    } else {
      missing++;
    }

    // Check Insurance
    if (item.insurance_expiry) {
      const daysUntil = Math.floor((new Date(item.insurance_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) expired++;
      else if (daysUntil <= 30) expiring_soon++;
      else active++;
    } else {
      missing++;
    }

    return {
      total: REQUIRED_DOCS.length,
      active,
      expired,
      expiring_soon,
      missing
    };
  };

  const getComplianceStatus = (docStatus: EquipmentDocStatus) => {
    if (docStatus.expired > 0) return "non-compliant";
    if (docStatus.expiring_soon > 0 || docStatus.missing > 0) return "expiring";
    return "compliant";
  };

  const filteredEquipment = equipment
    .filter(item => typeFilter === "all" || item.type === typeFilter)
    .filter(item => {
      if (filter === "all") return true;
      const docStatus = getEquipmentDocStatus(item);
      const status = getComplianceStatus(docStatus);
      return status === filter;
    });

  const stats = {
    total: equipment.length,
    trucks: equipment.filter(e => e.type === "truck").length,
    trailers: equipment.filter(e => e.type === "trailer").length,
    compliant: equipment.filter(e => getComplianceStatus(getEquipmentDocStatus(e)) === "compliant").length,
    expiring: equipment.filter(e => getComplianceStatus(getEquipmentDocStatus(e)) === "expiring").length,
    nonCompliant: equipment.filter(e => getComplianceStatus(getEquipmentDocStatus(e)) === "non-compliant").length,
  };

  if (loading) {
    return (
      <main className="p-8 bg-background min-h-screen">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading equipment...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 bg-background min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Equipment</h1>
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg">
          + Add Equipment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          icon="🚛"
          label="Total Equipment"
          value={stats.total.toString()}
          color="primary"
          onClick={() => { setFilter("all"); setTypeFilter("all"); }}
          active={filter === "all" && typeFilter === "all"}
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
          label="Expiring"
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
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setTypeFilter("truck")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              typeFilter === "truck" ? "bg-primary text-primary-foreground" : "bg-card border hover:border-primary/20"
            }`}
          >
            🚚 Trucks ({stats.trucks})
          </button>
          <button
            onClick={() => setTypeFilter("trailer")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              typeFilter === "trailer" ? "bg-primary text-primary-foreground" : "bg-card border hover:border-primary/20"
            }`}
          >
            🚛 Trailers ({stats.trailers})
          </button>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => (
          <EquipmentCard key={item.id} equipment={item} docStatus={getEquipmentDocStatus(item)} />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-20 bg-card rounded-xl border">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No equipment found</h3>
          <p className="text-muted-foreground">
            {filter !== "all" || typeFilter !== "all" 
              ? "No equipment matches the selected filters" 
              : "Add your first equipment to get started"}
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
        active ? colors[color as keyof typeof colors] + " ring-2 ring-offset-2" : "bg-card border hover:border-primary/20"
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

function EquipmentCard({ equipment, docStatus }: { equipment: Equipment; docStatus: EquipmentDocStatus }) {
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

  const typeIcons = {
    truck: "🚚",
    trailer: "🚛",
  };

  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-3xl">{typeIcons[equipment.type as keyof typeof typeIcons] || "🚛"}</span>
          <div>
            <h3 className="text-lg font-bold text-foreground">{equipment.unit_number}</h3>
            <p className="text-sm text-muted-foreground">
              {equipment.year} {equipment.make} {equipment.model}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[complianceStatus]}`}>
          {statusIcons[complianceStatus]} {complianceStatus.replace("-", " ").toUpperCase()}
        </span>
      </div>

      {/* Document Expiry Info */}
      <div className="space-y-2 mb-4">
        {equipment.registration_expiry && <ExpiryLine label="Registration" date={equipment.registration_expiry} />}
        {equipment.inspection_expiry && <ExpiryLine label="Inspection" date={equipment.inspection_expiry} />}
        {equipment.insurance_expiry && <ExpiryLine label="Insurance" date={equipment.insurance_expiry} />}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-3">
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
      <div className="grid grid-cols-4 gap-2 text-xs mb-4">
        <div className="text-center">
          <div className="font-bold text-success">{docStatus.active}</div>
          <div className="text-muted-foreground">Active</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-warning">{docStatus.expiring_soon}</div>
          <div className="text-muted-foreground">Expiring</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-destructive">{docStatus.expired}</div>
          <div className="text-muted-foreground">Expired</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-muted-foreground">{docStatus.missing}</div>
          <div className="text-muted-foreground">Missing</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
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

function ExpiryLine({ label, date }: { label: string; date: string }) {
  const daysUntil = Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntil < 0;
  const isExpiringSoon = daysUntil >= 0 && daysUntil <= 30;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${
        isExpired ? "text-destructive" : 
        isExpiringSoon ? "text-warning" : 
        "text-success"
      }`}>
        {new Date(date).toLocaleDateString()}
        {isExpired && " (EXPIRED)"}
        {isExpiringSoon && ` (${daysUntil}d)`}
      </span>
    </div>
  );
}
