"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";
import MapPreview from "../../../../components/MapPreview";

type Load = {
  id: number;
  load_number?: string | null;
  pickup_address: string;
  delivery_address: string;
};

type Driver = {
  id: number;
  name: string;
};

export default function DriverLoads() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadLoads();
  }, []);

  const loadLoads = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const data = await apiFetch("/loads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for active/assigned loads mainly
      setLoads(data.filter((l: any) => l.status !== 'Delivered' && l.status !== 'Cancelled'));
    } catch (err) {
      setError("Failed to load your assignments");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (loadId: number, nextStatus: string) => {
    try {
      const token = getToken();
      await apiFetch(`/dispatch/update-load-status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        params: { load_id: loadId, status: nextStatus }
      });
      loadLoads();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading your loads...</div>;

  return (
    <main className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Active Loads</h1>
        <button onClick={loadLoads} className="text-xs text-blue-400">Refresh</button>
      </div>

      {error && <div className="p-3 bg-red-900/20 text-red-400 rounded-lg text-sm">{error}</div>}

      {loads.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
          <p className="text-slate-500">No active loads assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {loads.map((load) => (
            <div key={load.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Load Number</span>
                  <h3 className="text-lg font-bold text-white">{load.load_number}</h3>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    load.status === 'Assigned' ? 'bg-yellow-500/10 text-yellow-500' :
                    load.status === 'In Transit' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    {load.status}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mb-1"></div>
                    <div className="w-0.5 h-10 bg-slate-700"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="text-sm font-semibold text-white">{load.pickup_address}</p>
                      <p className="text-xs text-blue-400">{load.pickup_date ? new Date(load.pickup_date).toLocaleString() : 'TBD'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Delivery</p>
                      <p className="text-sm font-semibold text-white">{load.delivery_address}</p>
                      <p className="text-xs text-green-400">{load.delivery_date ? new Date(load.delivery_date).toLocaleString() : 'TBD'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-500 block">Weight</span>
                    <span className="text-white">{load.weight ? `${load.weight.toLocaleString()} lbs` : 'N/A'}</span>
                  </div>
                  <div className="p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-500 block">Rate</span>
                    <span className="text-white font-bold">${load.rate_amount?.toLocaleString() || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800/20 border-t border-slate-800 flex gap-2">
                {load.status === 'Assigned' && (
                  <button 
                    onClick={() => updateStatus(load.id, 'Picked Up')}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
                  >
                    Mark as Picked Up
                  </button>
                )}
                {load.status === 'Picked Up' && (
                  <button 
                    onClick={() => updateStatus(load.id, 'In Transit')}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-900/20"
                  >
                    Start Transit
                  </button>
                )}
                {load.status === 'In Transit' && (
                  <button 
                    onClick={() => updateStatus(load.id, 'Delivered')}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-green-900/20"
                  >
                    Mark as Delivered
                  </button>
                )}
                <button 
                  onClick={() => router.push(`/driver/loads/${load.id}`)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
