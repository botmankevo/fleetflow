"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Load {
  id: number;
  load_number: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  rate_amount?: number;
  driver_id?: number;
  driver_name?: string;
  broker_name?: string;
  notes?: string;
  created_at: string;
}

interface Driver {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface DispatchStats {
  available_loads: number;
  assigned_loads: number;
  in_transit_loads: number;
  delivered_today: number;
  available_drivers: number;
  available_trucks: number;
}

export default function DispatchBoard() {
  const [loads, setLoads] = useState<{
    available: Load[];
    assigned: Load[];
    in_transit: Load[];
    delivered: Load[];
  }>({
    available: [],
    assigned: [],
    in_transit: [],
    delivered: [],
  });
  const [stats, setStats] = useState<DispatchStats | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedLoad, setDraggedLoad] = useState<Load | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [loadsData, statsData, driversData] = await Promise.all([
        apiFetch("/dispatch/loads-by-status"),
        apiFetch("/dispatch/stats"),
        apiFetch("/dispatch/available-drivers"),
      ]);

      setLoads(loadsData);
      setStats(statsData);
      setAvailableDrivers(driversData);
    } catch (error) {
      console.error("Failed to load dispatch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (load: Load) => {
    setDraggedLoad(load);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedLoad) return;

    try {
      const statusMap: { [key: string]: string } = {
        available: "Available",
        assigned: "Assigned",
        in_transit: "In Transit",
        delivered: "Delivered",
      };

      await apiFetch("/dispatch/update-load-status", {
        method: "POST",
        params: {
          load_id: draggedLoad.id,
          status: statusMap[newStatus],
        },
      });

      await loadData();
      setDraggedLoad(null);
    } catch (error) {
      console.error("Failed to update load status:", error);
      alert("Failed to update load status");
    }
  };

  const handleAssignDriver = async (driverId: number) => {
    if (!selectedLoad) return;

    try {
      await apiFetch("/dispatch/assign-load", {
        method: "POST",
        body: JSON.stringify({
          load_id: selectedLoad.id,
          driver_id: driverId,
        }),
      });

      await loadData();
      setShowAssignModal(false);
      setSelectedLoad(null);
    } catch (error) {
      console.error("Failed to assign driver:", error);
      alert("Failed to assign driver");
    }
  };

  const handleUnassign = async (loadId: number) => {
    if (!confirm("Remove driver assignment?")) return;

    try {
      await apiFetch(`/dispatch/unassign-load/${loadId}`, {
        method: "POST",
      });

      await loadData();
    } catch (error) {
      console.error("Failed to unassign load:", error);
      alert("Failed to unassign load");
    }
  };

  const getAddressShort = (address: string) => {
    const parts = address.split(",");
    return parts.length > 1 ? `${parts[0]}, ${parts[parts.length - 2]?.trim()}` : address;
  };

  if (loading) {
    return (
      <main className="p-8 bg-slate-50 min-h-screen">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dispatch board...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dispatch Board
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time load assignment and tracking
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard
            label="Available Loads"
            value={stats.available_loads}
            color="blue"
            icon="📦"
          />
          <StatCard
            label="Assigned"
            value={stats.assigned_loads}
            color="yellow"
            icon="📋"
          />
          <StatCard
            label="In Transit"
            value={stats.in_transit_loads}
            color="purple"
            icon="🚛"
          />
          <StatCard
            label="Delivered Today"
            value={stats.delivered_today}
            color="green"
            icon="✅"
          />
          <StatCard
            label="Available Drivers"
            value={stats.available_drivers}
            color="indigo"
            icon="👤"
          />
          <StatCard
            label="Available Trucks"
            value={stats.available_trucks}
            color="gray"
            icon="🚚"
          />
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[600px]">
        {/* Available Column */}
        <KanbanColumn
          title="Available Loads"
          count={loads.available.length}
          color="blue"
          loads={loads.available}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop("available")}
          onAssignClick={(load) => {
            setSelectedLoad(load);
            setShowAssignModal(true);
          }}
          getAddressShort={getAddressShort}
        />

        {/* Assigned Column */}
        <KanbanColumn
          title="Assigned"
          count={loads.assigned.length}
          color="yellow"
          loads={loads.assigned}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop("assigned")}
          onUnassign={handleUnassign}
          getAddressShort={getAddressShort}
        />

        {/* In Transit Column */}
        <KanbanColumn
          title="In Transit"
          count={loads.in_transit.length}
          color="purple"
          loads={loads.in_transit}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop("in_transit")}
          getAddressShort={getAddressShort}
        />

        {/* Delivered Column */}
        <KanbanColumn
          title="Delivered"
          count={loads.delivered.length}
          color="green"
          loads={loads.delivered}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop("delivered")}
          getAddressShort={getAddressShort}
        />
      </div>

      {/* Assign Driver Modal */}
      {showAssignModal && selectedLoad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Assign Driver
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedLoad(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-900">
                {selectedLoad.load_number}
              </p>
              <p className="text-sm text-blue-700">
                {getAddressShort(selectedLoad.pickup_address)} →{" "}
                {getAddressShort(selectedLoad.delivery_address)}
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableDrivers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No available drivers
                </p>
              ) : (
                availableDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => handleAssignDriver(driver.id)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors"
                  >
                    <p className="font-semibold text-gray-900">
                      {driver.name}
                    </p>
                    {driver.phone && (
                      <p className="text-sm text-gray-600">{driver.phone}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-green-50 text-green-600 border-green-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div
      className={`p-4 rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-xs font-semibold mt-2 opacity-75">{label}</p>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  title,
  count,
  color,
  loads,
  onDragStart,
  onDragOver,
  onDrop,
  onAssignClick,
  onUnassign,
  getAddressShort,
}: {
  title: string;
  count: number;
  color: string;
  loads: Load[];
  onDragStart: (load: Load) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onAssignClick?: (load: Load) => void;
  onUnassign?: (loadId: number) => void;
  getAddressShort: (address: string) => string;
}) {
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-100 border-blue-300",
    yellow: "bg-yellow-100 border-yellow-300",
    purple: "bg-purple-100 border-purple-300",
    green: "bg-green-100 border-green-300",
  };

  return (
    <div
      className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex flex-col"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className={`flex items-center justify-between mb-4 p-3 rounded-lg ${colorClasses[color]}`}
      >
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-bold">
          {count}
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {loads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">No loads</p>
          </div>
        ) : (
          loads.map((load) => (
            <LoadCard
              key={load.id}
              load={load}
              onDragStart={onDragStart}
              onAssignClick={onAssignClick}
              onUnassign={onUnassign}
              getAddressShort={getAddressShort}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Load Card Component
function LoadCard({
  load,
  onDragStart,
  onAssignClick,
  onUnassign,
  getAddressShort,
}: {
  load: Load;
  onDragStart: (load: Load) => void;
  onAssignClick?: (load: Load) => void;
  onUnassign?: (loadId: number) => void;
  getAddressShort: (address: string) => string;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(load)}
      className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-lg hover:border-green-400 transition-all cursor-move"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-bold text-gray-900">{load.load_number}</span>
        {load.rate_amount && (
          <span className="text-green-600 font-bold text-sm">
            ${load.rate_amount.toLocaleString()}
          </span>
        )}
      </div>

      <div className="space-y-1 text-xs text-gray-600 mb-3">
        <p className="flex items-start gap-1">
          <span className="text-blue-500">📦</span>
          <span className="flex-1">
            {getAddressShort(load.pickup_address)}
          </span>
        </p>
        <p className="flex items-start gap-1">
          <span className="text-green-500">🚚</span>
          <span className="flex-1">
            {getAddressShort(load.delivery_address)}
          </span>
        </p>
      </div>

      {load.driver_name && (
        <div className="mb-2 flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
          <span>👤</span>
          <span className="font-semibold">{load.driver_name}</span>
        </div>
      )}

      {load.broker_name && (
        <p className="text-xs text-gray-500 mb-2">🏢 {load.broker_name}</p>
      )}

      <div className="flex gap-2 mt-3">
        {onAssignClick && !load.driver_id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssignClick(load);
            }}
            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Assign Driver
          </button>
        )}

        {onUnassign && load.driver_id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnassign(load.id);
            }}
            className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Unassign
          </button>
        )}

        <a
          href={`/admin/loads/${load.id}`}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </a>
      </div>
    </div>
  );
}
