"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type Driver = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    fetchDrivers();
  }, []);

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

  async function createDriver(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch("/drivers", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
        }),
      });
      setForm({ name: "", email: "", phone: "" });
      await fetchDrivers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create driver"));
    } finally {
      setCreating(false);
    }
  }

  async function saveDriver(driver: Driver) {
    setSavingId(driver.id);
    setError(null);
    try {
      const token = getToken();
      await apiFetch(`/drivers/${driver.id}`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: driver.name,
          email: driver.email || null,
          phone: driver.phone || null,
        }),
      });
      await fetchDrivers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update driver"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">Drivers</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Create Driver</h2>
        <form onSubmit={createDriver} className="grid gap-3">
          <input
            className="input w-full"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input w-full"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input w-full"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button className="btn" disabled={creating}>
            {creating ? "Creating..." : "Create Driver"}
          </button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">All Drivers</h2>
        {drivers.length === 0 && <div className="text-xs text-slate">No drivers yet.</div>}
        {drivers.map((driver) => (
          <div key={driver.id} className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="grid gap-2 md:grid-cols-3">
              <input
                className="input w-full"
                placeholder="Name"
                value={driver.name}
                onChange={(e) =>
                  setDrivers((prev) =>
                    prev.map((d) => (d.id === driver.id ? { ...d, name: e.target.value } : d))
                  )
                }
              />
              <input
                className="input w-full"
                placeholder="Email"
                value={driver.email ?? ""}
                onChange={(e) =>
                  setDrivers((prev) =>
                    prev.map((d) => (d.id === driver.id ? { ...d, email: e.target.value } : d))
                  )
                }
              />
              <input
                className="input w-full"
                placeholder="Phone"
                value={driver.phone ?? ""}
                onChange={(e) =>
                  setDrivers((prev) =>
                    prev.map((d) => (d.id === driver.id ? { ...d, phone: e.target.value } : d))
                  )
                }
              />
            </div>
            <button className="btn" onClick={() => saveDriver(driver)} disabled={savingId === driver.id}>
              {savingId === driver.id ? "Saving..." : "Save"}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
