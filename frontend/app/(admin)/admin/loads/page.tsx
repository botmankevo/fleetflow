"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "../../../../lib/api";

export default function AdminLoads() {
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
      <h1 className="text-xl text-gold">Loads</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="space-y-2">
        {loads.map((l) => (
          <div key={l.id} className="card">
            <Link className="link" href={`/admin/loads/${l.id}`}>
              {l.fields?.["Load #"] || l.id}
            </Link>
            <div className="text-xs text-slate">{l.fields?.["Pickup Address"]} → {l.fields?.["Delivery Address"]}</div>
          </div>
        ))}
        {loads.length === 0 && <div className="text-xs text-slate">No loads yet.</div>}
      </div>
    </main>
  );
}
