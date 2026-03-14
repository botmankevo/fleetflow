"use client";

import React, { useState, useEffect } from "react";
import { Load } from "./LoadCard";
import { Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getRPMColorClass, FinancialSettings } from "@/lib/financials";
import { cn } from "@/lib/utils";

interface Driver {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export function LoadKanbanBoard({ 
  settings, 
  onRefresh, 
  onAIModalOpen 
}: { 
  settings: FinancialSettings | null, 
  onRefresh: () => void,
  onAIModalOpen: () => void
}) {
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
  
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [draggedLoad, setDraggedLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [loadsData, driversData] = await Promise.all([
        apiFetch("/dispatch/loads-by-status"),
        apiFetch("/dispatch/available-drivers")
      ]);

      setLoads(loadsData);
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
      onRefresh(); // refresh main table 
      setDraggedLoad(null);
    } catch (error) {
      console.error("Failed to update load status:", error);
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
      onRefresh();
      setShowAssignModal(false);
      setSelectedLoad(null);
    } catch (error) {
      console.error("Failed to assign driver:", error);
    }
  };

  const handleUnassign = async (loadId: number) => {
    if (!confirm("Remove driver assignment?")) return;

    try {
      await apiFetch(`/dispatch/unassign-load/${loadId}`, {
        method: "POST",
      });

      await loadData();
      onRefresh();
    } catch (error) {
      console.error("Failed to unassign load:", error);
    }
  };

  const handleNotifyDriver = async (loadId: number) => {
    try {
      await apiFetch("/communications/notify/load-assigned", {
        method: "POST",
        params: { load_id: loadId },
      });
      alert("Notification sent to driver!");
    } catch (error) {
      console.error("Failed to notify driver:", error);
      alert("Failed to send notification.");
    }
  };

  const getAddressShort = (address?: string) => {
    if (!address) return "TBD";
    const parts = address.split(",");
    return parts.length > 1 ? `${parts[0].trim()}, ${parts[parts.length - 2]?.trim()}` : address;
  };

  if (loading) {
    return (
      <div className="py-20 text-center bg-gray-50 rounded-lg">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading Kanban board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Dispatch Board</h2>
          <p className="text-sm text-gray-500">Drag to update status, click to assign.</p>
        </div>
        <button
          onClick={onAIModalOpen}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold shadow hover:shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Create with AI
        </button>
      </div>

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
          onNotifyClick={handleNotifyDriver}
          getAddressShort={getAddressShort}
          settings={settings}
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
          onNotifyClick={handleNotifyDriver}
          onUnassign={handleUnassign}
          getAddressShort={getAddressShort}
          settings={settings}
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
          onNotifyClick={handleNotifyDriver}
          getAddressShort={getAddressShort}
          settings={settings}
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
          onNotifyClick={handleNotifyDriver}
          getAddressShort={getAddressShort}
          settings={settings}
        />
      </div>

      {showAssignModal && selectedLoad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Assign Driver
              </h3>
              <button onClick={() => { setShowAssignModal(false); setSelectedLoad(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-900">{selectedLoad.load_number}</p>
              <p className="text-sm text-blue-700">
                {getAddressShort(selectedLoad.pickup_address || selectedLoad.pickup_location)} →{" "}
                {getAddressShort(selectedLoad.delivery_address || selectedLoad.delivery_location)}
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableDrivers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No available drivers</p>
              ) : (
                availableDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => handleAssignDriver(driver.id)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors"
                  >
                    <p className="font-semibold text-gray-900">{driver.name}</p>
                    {driver.phone && <p className="text-sm text-gray-600">{driver.phone}</p>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  title, count, color, loads, onDragStart, onDragOver, onDrop,
  onAssignClick, onNotifyClick, onUnassign, getAddressShort, settings,
}: {
  title: string; count: number; color: string; loads: Load[];
  onDragStart: (load: Load) => void; onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void; onAssignClick?: (load: Load) => void;
  onNotifyClick?: (loadId: number) => void; onUnassign?: (loadId: number) => void;
  getAddressShort: (address?: string) => string; settings?: FinancialSettings | null;
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
      <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${colorClasses[color]}`}>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-bold">{count}</span>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {loads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">No loads</p>
          </div>
        ) : (
          loads.map((load) => (
            <KanbanLoadCard key={load.id} load={load} onDragStart={onDragStart}
              onAssignClick={onAssignClick} onNotifyClick={onNotifyClick}
              onUnassign={onUnassign} getAddressShort={getAddressShort} settings={settings} />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanLoadCard({
  load, onDragStart, onAssignClick, onNotifyClick, onUnassign, getAddressShort, settings,
}: {
  load: Load; onDragStart: (load: Load) => void; onAssignClick?: (load: Load) => void;
  onNotifyClick?: (loadId: number) => void; onUnassign?: (loadId: number) => void;
  getAddressShort: (address?: string) => string; settings?: FinancialSettings | null;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(load)}
      className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-lg hover:border-green-400 transition-all cursor-move"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{load.load_number}</span>
          {load.load_type === 'Partial' && (
            <span className="text-[10px] font-bold text-amber-600 uppercase">Partial</span>
          )}
        </div>
        <div className="text-right">
          {load.rate_amount && <div className="text-green-600 font-bold text-sm">${load.rate_amount.toLocaleString()}</div>}
          {load.rate_per_mile && (
            <div className={cn("text-[10px]", getRPMColorClass(load.rate_per_mile, settings || undefined))}>
              ${load.rate_per_mile.toFixed(2)}/mi
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1 text-xs text-gray-600 mb-2">
        <p className="flex items-start gap-1">
          <span className="text-blue-500">📦</span>
          <span className="flex-1 truncate font-medium">{getAddressShort(load.pickup_address || load.pickup_location)}</span>
        </p>
        <p className="flex items-start gap-1">
          <span className="text-green-500">🚚</span>
          <span className="flex-1 truncate font-medium">{getAddressShort(load.delivery_address || load.delivery_location)}</span>
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-3 text-[10px] bg-white/50 p-1 rounded border border-gray-100 italic">
        <span>{load.total_miles || 0} loaded mi</span>
        {load.deadhead_miles ? <span className="text-amber-600 font-bold">{load.deadhead_miles} deadhead mi</span> : null}
      </div>

      {(load.driver_name || (load.driver && load.driver.name)) && (
        <div className="mb-2 flex items-center justify-between gap-2 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span className="font-semibold">{load.driver_name || load.driver?.name}</span>
          </div>
          {onNotifyClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onNotifyClick(load.id); }}
              title="Notify Driver"
              className="p-1 hover:bg-indigo-200 rounded text-indigo-900 transition-colors"
            >🔔</button>
          )}
        </div>
      )}

      {load.broker_name && <p className="text-xs text-gray-500 mb-2">🏢 {load.broker_name}</p>}

      <div className="flex gap-2 mt-3">
        {onAssignClick && !load.driver_id && !load.driver && (
          <button
            onClick={(e) => { e.stopPropagation(); onAssignClick(load); }}
            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Assign Driver
          </button>
        )}
        {onUnassign && (load.driver_id || load.driver) && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnassign(load.id); }}
            className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition-colors"
            title="Unassign"
          >✕</button>
        )}
      </div>
    </div>
  );
}
