"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type Load = {
  id: number;
  load_number?: string | null;
  pickup_address: string;
  delivery_address: string;
  driver_id?: number | null;
};

type Driver = {
  id: number;
  name: string;
  email?: string | null;
};

export default function AdminLoads() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const me = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (me?.role !== "admin" && me?.role !== "dispatcher") {
          router.replace("/driver");
          return;
        }
        const driverRes = await apiFetch("/drivers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDrivers(driverRes);
        const res = await apiFetch("/loads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoads(res);
        setReady(true);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load"));
      }
    })();
  }, [router]);

  async function updateLoadDriver(loadId: number, driverId: string) {
    try {
      setSavingId(loadId);
      const token = getToken();
      await apiFetch(`/loads/${loadId}`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driver_id: driverId ? Number(driverId) : null,
        }),
      });
      const res = await apiFetch("/loads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoads(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update load"));
    } finally {
      setSavingId(null);
    }
  }

  if (!ready) {
    return <main className="p-6 text-slate">Checking access…</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">Loads</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="space-y-2">
        {loads.map((l) => (
          <div key={l.id} className="card">
            <Link className="link" href={`/admin/loads/${l.id}`}>
              {l.load_number || l.id}
            </Link>
            <div className="text-xs text-slate">{l.pickup_address} → {l.delivery_address}</div>
            <div className="text-xs text-slate mt-1">
              Driver: {drivers.find((d) => d.id === l.driver_id)?.name || "Unassigned"}
            </div>
            <div className="mt-3">
              <select
                className="input w-full"
                value={l.driver_id ?? ""}
                onChange={(e) => updateLoadDriver(l.id, e.target.value)}
                disabled={savingId === l.id}
              >
                <option value="">Assign Driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.email ? ` (${d.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {loads.length === 0 && <div className="text-xs text-slate">No loads yet.</div>}
      </div>
    </main>
  );
}
