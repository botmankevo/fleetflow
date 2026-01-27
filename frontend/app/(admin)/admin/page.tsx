"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "../../../lib/api";

export default function AdminDashboard() {
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
      <header className="flex items-center justify-between">
        <h1 className="text-xl text-gold">Admin Dashboard</h1>
        <div className="space-x-4 text-sm">
          <Link className="link" href="/driver/loads">Driver Loads</Link>
          <Link className="link" href="/driver/pod">Driver POD</Link>
        </div>
      </header>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <section className="card">
        <h2 className="text-sm text-slate">All Loads</h2>
        <div className="mt-3 space-y-2">
          {loads.map((l) => (
            <div key={l.id} className="border border-white/10 rounded-lg p-3">
              <div className="text-gold">{l.fields?.["Load #"] || l.id}</div>
              <div className="text-xs text-slate">{l.fields?.["Pickup Address"]} → {l.fields?.["Delivery Address"]}</div>
            </div>
          ))}
          {loads.length === 0 && <div className="text-xs text-slate">No loads yet.</div>}
        </div>
      </section>
    </main>
  );
}
