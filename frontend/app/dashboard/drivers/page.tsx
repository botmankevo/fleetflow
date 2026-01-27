"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, getToken, getUserFromToken } from "@/src/lib/api";

type Driver = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
};

export default function DriversPage() {
  const token = useMemo(() => getToken(), []);
  const role = getUserFromToken()?.role;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    license_number: "",
    license_state: "",
  });

  async function fetchDrivers() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/tenant/drivers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function createDriver(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiFetch("/tenant/drivers", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        license_number: "",
        license_state: "",
      });
      await fetchDrivers();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create driver");
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
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0 }}>Drivers</h1>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Add Driver</h2>
        <form onSubmit={createDriver} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="License #" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
            <input placeholder="License State" value={form.license_state} onChange={(e) => setForm({ ...form, license_state: e.target.value })} />
          </div>
          <button type="submit">Create Driver</button>
        </form>
      </section>

      <section>
        <h2 style={{ marginBottom: 8 }}>Existing Drivers</h2>
        {loading ? (
          <p>Loading...</p>
        ) : drivers.length === 0 ? (
          <p>No drivers yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {drivers.map((driver) => (
              <div key={driver.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                <strong>
                  {driver.first_name} {driver.last_name}
                </strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {driver.email || "—"} | {driver.phone || "—"} | {driver.license_number || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
