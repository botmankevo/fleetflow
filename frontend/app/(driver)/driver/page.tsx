"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getErrorMessage, getToken } from "../../../lib/api";

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

export default function DriverDashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) return;
        const me = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (me?.driver_id) {
          const drivers = (await apiFetch("/drivers", {
            headers: { Authorization: `Bearer ${token}` },
          })) as Driver[];
          const match = drivers.find((d) => d.id === me.driver_id);
          if (match?.name) setDriverName(match.name);
        }
        const res = await apiFetch("/loads", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setLoads(res);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load"));
      }
    })();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl text-gold">Driver Dashboard</h1>
        <Link className="link" href="/driver/pod">Submit POD</Link>
      </header>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <section className="card">
        <h2 className="text-sm text-slate">Assigned Loads</h2>
        <div className="mt-3 space-y-2">
          {loads.map((l) => (
            <div key={l.id} className="border border-white/10 rounded-lg p-3">
              <div className="text-gold">{l.load_number || l.id}</div>
              <div className="text-xs text-slate">{l.pickup_address} → {l.delivery_address}</div>
              <div className="text-xs text-slate mt-1">Driver: {driverName || "You"}</div>
            </div>
          ))}
          {loads.length === 0 && <div className="text-xs text-slate">No assigned loads.</div>}
        </div>
      </section>
    </main>
  );
}
