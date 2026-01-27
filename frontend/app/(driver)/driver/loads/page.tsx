"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "../../../../lib/api";
import MapPreview from "../../../../components/MapPreview";

export default function DriverLoads() {
  const [loads, setLoads] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await apiFetch("/loads", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setLoads(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">My Loads</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {loads.map((l) => (
        <div key={l.id} className="card space-y-3">
          <div className="text-gold">{l.fields?.["Load #"] || l.id}</div>
          <div className="text-xs text-slate">{l.fields?.["Pickup Address"]} → {l.fields?.["Delivery Address"]}</div>
          <MapPreview from={l.fields?.["Pickup Address"] || ""} to={l.fields?.["Delivery Address"] || ""} />
        </div>
      ))}
    </main>
  );
}
