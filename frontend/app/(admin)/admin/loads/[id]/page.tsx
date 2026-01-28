"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getErrorMessage, getToken } from "../../../../../lib/api";

type Load = {
  id: number;
  load_number?: string | null;
  status?: string | null;
  pickup_address?: string | null;
  delivery_address?: string | null;
  notes?: string | null;
  driver_id?: number | null;
};

type Driver = {
  id: number;
  name: string;
  email?: string | null;
};

export default function AdminLoadDetail() {
  const params = useParams();
  const loadId = params?.id as string;
  const [load, setLoad] = useState<Load | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [ready, setReady] = useState(false);

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
        const res = await apiFetch(`/loads/${loadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoad(res);
        setReady(true);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load"));
      }
    })();
  }, [loadId, router]);

  async function save() {
    if (!load) return;
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch(`/loads/${loadId}`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          load_number: load.load_number,
          status: load.status,
          pickup_address: load.pickup_address,
          delivery_address: load.delivery_address,
          notes: load.notes,
          driver_id: load.driver_id,
        }),
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !load) {
    return (
      <main className="p-6">
        <div className="text-slate">Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <Link className="link" href="/admin/loads">← Back</Link>
        <div className="text-right">
          <h1 className="text-xl text-gold">Load {load.load_number || load.id}</h1>
          <div className="text-xs text-slate">
            Driver: {drivers.find((d) => d.id === load.driver_id)?.name || "Unassigned"}
          </div>
          <div className="text-xs text-slate">Status: {load.status || "Unknown"}</div>
        </div>
      </header>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="card space-y-3">
        <input
          className="input w-full"
          placeholder="Load #"
          value={load.load_number || ""}
          onChange={(e) => setLoad({ ...load, load_number: e.target.value })}
        />
        <input
          className="input w-full"
          placeholder="Status"
          value={load.status || ""}
          onChange={(e) => setLoad({ ...load, status: e.target.value })}
        />
        <select
          className="input w-full"
          value={load.driver_id ?? ""}
          onChange={(e) =>
            setLoad({
              ...load,
              driver_id: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Assign Driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}{d.email ? ` (${d.email})` : ""}
            </option>
          ))}
        </select>
        <input
          className="input w-full"
          placeholder="Pickup Address"
          value={load.pickup_address || ""}
          onChange={(e) => setLoad({ ...load, pickup_address: e.target.value })}
        />
        <input
          className="input w-full"
          placeholder="Delivery Address"
          value={load.delivery_address || ""}
          onChange={(e) => setLoad({ ...load, delivery_address: e.target.value })}
        />
        <textarea
          className="input w-full"
          rows={4}
          placeholder="Notes"
          value={load.notes || ""}
          onChange={(e) => setLoad({ ...load, notes: e.target.value })}
        />
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </main>
  );
}
