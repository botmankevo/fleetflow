"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken, getUserFromToken } from "@/src/lib/api";

type Load = {
  id: number;
  load_number: string;
  status: string;
  pickup_location: string;
  pickup_date?: string | null;
  delivery_location: string;
  delivery_date?: string | null;
  broker_name?: string | null;
  broker_phone?: string | null;
  broker_email?: string | null;
  carrier?: string | null;
  truck_number?: string | null;
  trailer_number?: string | null;
  driver_id?: number | null;
};

type Driver = {
  id: number;
  first_name: string;
  last_name: string;
};

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assigning, setAssigning] = useState<Record<number, boolean>>({});
  const [driverSelections, setDriverSelections] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [rateConfFile, setRateConfFile] = useState<File | null>(null);

  const token = useMemo(() => getToken(), []);
  const role = getUserFromToken()?.role;

  const [form, setForm] = useState({
    load_number: "",
    pickup_location: "",
    pickup_date: "",
    delivery_location: "",
    delivery_date: "",
    broker_name: "",
    broker_phone: "",
    broker_email: "",
    carrier: "",
    truck_number: "",
    trailer_number: "",
    notes: "",
  });

  async function fetchLoads() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/tenant/loads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoads(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load loads");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDrivers() {
    if (!token) return;
    try {
      const data = await apiFetch("/tenant/drivers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(data);
    } catch {
      // Leave empty; drivers are optional for initial setup.
    }
  }

  useEffect(() => {
    fetchLoads();
    fetchDrivers();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/tenant/loads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({
        load_number: "",
        pickup_location: "",
        pickup_date: "",
        delivery_location: "",
        delivery_date: "",
        broker_name: "",
        broker_phone: "",
        broker_email: "",
        carrier: "",
        truck_number: "",
        trailer_number: "",
        notes: "",
      });
      await fetchLoads();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create load");
    } finally {
      setCreating(false);
    }
  }

  async function onExtract() {
    if (!token) return;
    if (!rateConfFile) {
      setError("Please choose a PDF rate confirmation first.");
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", rateConfFile);
      const data = await apiFetch("/tenant/loads/extract-rate-confirmation", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (data?.extracted) {
        setForm((prev) => ({ ...prev, ...data.extracted }));
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to extract rate confirmation");
    } finally {
      setExtracting(false);
    }
  }

  async function assignDriver(loadId: number) {
    if (!token) return;
    const driverId = driverSelections[loadId];
    if (!driverId) return;
    setAssigning((prev) => ({ ...prev, [loadId]: true }));
    setError(null);
    try {
      await apiFetch(`/tenant/loads/${loadId}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId }),
      });
      await fetchLoads();
    } catch (e: any) {
      setError(e?.message ?? "Failed to assign driver");
    } finally {
      setAssigning((prev) => ({ ...prev, [loadId]: false }));
    }
  }

  if (role && role !== "tenant_admin" && role !== "dispatcher" && role !== "platform_owner") {
    return (
      <main style={{ padding: 24 }}>
        <p>Access denied.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <header>
        <h1 style={{ margin: 0 }}>Loads</h1>
        <p style={{ marginTop: 6, opacity: 0.7 }}>
          Upload a rate confirmation and click extract to prefill fields (stub).
        </p>
      </header>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 12,
          maxWidth: 900,
        }}
      >
        <h2 style={{ margin: 0 }}>Create Load</h2>

        <div style={{ display: "grid", gap: 8 }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setRateConfFile(e.target.files?.[0] ?? null)}
          />
          <button type="button" onClick={onExtract} disabled={extracting || !rateConfFile}>
            {extracting ? "Extracting..." : "Extract from Rate Confirmation"}
          </button>
        </div>

        <form onSubmit={onCreate} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <input
              placeholder="Load #"
              value={form.load_number}
              onChange={(e) => setForm({ ...form, load_number: e.target.value })}
              required
            />
            <input
              placeholder="Carrier"
              value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <input
              placeholder="Truck #"
              value={form.truck_number}
              onChange={(e) => setForm({ ...form, truck_number: e.target.value })}
            />
            <input
              placeholder="Trailer #"
              value={form.trailer_number}
              onChange={(e) => setForm({ ...form, trailer_number: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <input
              placeholder="Pickup Location"
              value={form.pickup_location}
              onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
              required
            />
            <input
              placeholder="Delivery Location"
              value={form.delivery_location}
              onChange={(e) => setForm({ ...form, delivery_location: e.target.value })}
              required
            />
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <input
              placeholder="Pickup Date"
              value={form.pickup_date}
              onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
            />
            <input
              placeholder="Delivery Date"
              value={form.delivery_date}
              onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <input
              placeholder="Broker Name"
              value={form.broker_name}
              onChange={(e) => setForm({ ...form, broker_name: e.target.value })}
            />
            <input
              placeholder="Broker Phone"
              value={form.broker_phone}
              onChange={(e) => setForm({ ...form, broker_phone: e.target.value })}
            />
          </div>

          <input
            placeholder="Broker Email"
            value={form.broker_email}
            onChange={(e) => setForm({ ...form, broker_email: e.target.value })}
          />

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Load"}
          </button>
        </form>
      </section>

      <section>
        <h2 style={{ marginBottom: 8 }}>Existing Loads</h2>
        {loading ? (
          <p>Loading...</p>
        ) : loads.length === 0 ? (
          <p>No loads yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {loads.map((load) => (
              <div
                key={load.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>
                    <Link href={`/dashboard/loads/${load.id}`}>Load #{load.load_number}</Link>
                  </strong>
                  <span>{load.status}</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {load.pickup_location} → {load.delivery_location}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Truck: {load.truck_number || "—"} | Trailer: {load.trailer_number || "—"} | Carrier: {load.carrier || "—"}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={driverSelections[load.id] ?? load.driver_id ?? ""}
                    onChange={(e) =>
                      setDriverSelections((prev) => ({
                        ...prev,
                        [load.id]: Number(e.target.value),
                      }))
                    }
                  >
                    <option value="">Assign driver...</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.first_name} {driver.last_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!driverSelections[load.id] || assigning[load.id]}
                    onClick={() => assignDriver(load.id)}
                  >
                    {assigning[load.id] ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
