"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage, getToken } from "../../../lib/api";

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

export default function AdminDashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({
    loadNumber: "",
    status: "Created",
    pickup: "",
    delivery: "",
    notes: "",
    driverId: "",
  });

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
        await fetchDrivers();
        await fetchLoads();
        setReady(true);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load"));
      }
    })();
  }, [router]);

  async function fetchDrivers() {
    try {
      const token = getToken();
      const res = await apiFetch("/drivers", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setDrivers(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load drivers"));
    }
  }

  async function fetchLoads() {
    try {
      const token = getToken();
      const res = await apiFetch("/loads", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setLoads(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load"));
    }
  }

  async function createLoad(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch("/loads", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          load_number: form.loadNumber,
          status: form.status,
          pickup_address: form.pickup,
          delivery_address: form.delivery,
          notes: form.notes,
          driver_id: form.driverId ? Number(form.driverId) : null,
        }),
      });
      setForm({ loadNumber: "", status: "Created", pickup: "", delivery: "", notes: "", driverId: "" });
      await fetchLoads();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create load"));
    } finally {
      setCreating(false);
    }
  }

  if (!ready) {
    return <main className="p-6 text-slate">Checking access…</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl text-gold">Admin Dashboard</h1>
        <div className="space-x-4 text-sm">
          <Link className="link" href="/admin/drivers">Drivers</Link>
          <Link className="link" href="/driver/loads">Driver Loads</Link>
          <Link className="link" href="/driver/pod">Driver POD</Link>
        </div>
      </header>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Create Load</h2>
        <form onSubmit={createLoad} className="grid gap-3">
          <input
            className="input w-full"
            placeholder="Load #"
            value={form.loadNumber}
            onChange={(e) => setForm({ ...form, loadNumber: e.target.value })}
            required
          />
          <select
            className="input w-full"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Created</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Delivered</option>
          </select>
          <select
            className="input w-full"
            value={form.driverId}
            onChange={(e) => setForm({ ...form, driverId: e.target.value })}
          >
            <option value="">Assign Driver (optional)</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.email ? ` (${d.email})` : ""}
              </option>
            ))}
          </select>
          <input
            className="input w-full"
            placeholder="Pickup Address"
            value={form.pickup}
            onChange={(e) => setForm({ ...form, pickup: e.target.value })}
            required
          />
          <input
            className="input w-full"
            placeholder="Delivery Address"
            value={form.delivery}
            onChange={(e) => setForm({ ...form, delivery: e.target.value })}
            required
          />
          <textarea
            className="input w-full"
            placeholder="Notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button className="btn" disabled={creating}>
            {creating ? "Creating..." : "Create Load"}
          </button>
        </form>
      </section>
      <section className="card">
        <h2 className="text-sm text-slate">All Loads</h2>
        <div className="mt-3 space-y-2">
          {loads.map((l) => (
            <div key={l.id} className="border border-white/10 rounded-lg p-3">
              <div className="text-gold">
                <Link className="link" href={`/admin/loads/${l.id}`}>
                  {l.load_number || l.id}
                </Link>
              </div>
              <div className="text-xs text-slate">{l.pickup_address} → {l.delivery_address}</div>
            </div>
          ))}
          {loads.length === 0 && <div className="text-xs text-slate">No loads yet.</div>}
        </div>
      </section>
    </main>
  );
}
