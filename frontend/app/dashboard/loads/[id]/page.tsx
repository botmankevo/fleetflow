"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  notes?: string | null;
  driver_id?: number | null;
};

type Driver = {
  id: number;
  first_name: string;
  last_name: string;
};

type AuditLog = {
  id: number;
  action: string;
  resource_type: string;
  resource_id: number | null;
  details: any;
  created_at: string;
  user_id: number | null;
};

const STATUS_OPTIONS = ["created", "assigned", "in_progress", "delivered", "cancelled"];

export default function LoadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useMemo(() => getToken(), []);
  const role = getUserFromToken()?.role;
  const loadId = Number(params?.id);

  const [load, setLoad] = useState<Load | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !loadId) return;
    (async () => {
      try {
        const data = await apiFetch(`/tenant/loads/${loadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoad(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
  }, [token, loadId]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await apiFetch("/tenant/drivers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDrivers(data);
      } catch {
        // ignore
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !loadId) return;
    (async () => {
      try {
        const data = await apiFetch(`/tenant/audit-logs?resource_type=load&resource_id=${loadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuditLogs(data);
      } catch {
        // ignore
      }
    })();
  }, [token, loadId]);

  async function saveLoad() {
    if (!token || !load) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch(`/tenant/loads/${load.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(load),
      });
      setLoad(updated);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save load");
    } finally {
      setSaving(false);
    }
  }

  async function assignDriver(driverId: number) {
    if (!token || !load) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch(`/tenant/loads/${load.id}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId }),
      });
      setLoad(updated);
    } catch (e: any) {
      setError(e?.message ?? "Failed to assign driver");
    } finally {
      setSaving(false);
    }
  }

  if (role && role !== "tenant_admin" && role !== "dispatcher" && role !== "platform_owner") {
    return (
      <main style={{ padding: 24 }}>
        <p>Access denied.</p>
      </main>
    );
  }

  if (!load) {
    return (
      <main style={{ padding: 24 }}>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard/loads">← Loads</Link>
        <h1 style={{ margin: 0 }}>Load #{load.load_number}</h1>
      </header>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Details</h2>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <input value={load.pickup_location} onChange={(e) => setLoad({ ...load, pickup_location: e.target.value })} />
          <input value={load.delivery_location} onChange={(e) => setLoad({ ...load, delivery_location: e.target.value })} />
          <input placeholder="Pickup Date" value={load.pickup_date ?? ""} onChange={(e) => setLoad({ ...load, pickup_date: e.target.value })} />
          <input placeholder="Delivery Date" value={load.delivery_date ?? ""} onChange={(e) => setLoad({ ...load, delivery_date: e.target.value })} />
          <input placeholder="Broker Name" value={load.broker_name ?? ""} onChange={(e) => setLoad({ ...load, broker_name: e.target.value })} />
          <input placeholder="Broker Phone" value={load.broker_phone ?? ""} onChange={(e) => setLoad({ ...load, broker_phone: e.target.value })} />
          <input placeholder="Broker Email" value={load.broker_email ?? ""} onChange={(e) => setLoad({ ...load, broker_email: e.target.value })} />
          <input placeholder="Carrier" value={load.carrier ?? ""} onChange={(e) => setLoad({ ...load, carrier: e.target.value })} />
          <input placeholder="Truck #" value={load.truck_number ?? ""} onChange={(e) => setLoad({ ...load, truck_number: e.target.value })} />
          <input placeholder="Trailer #" value={load.trailer_number ?? ""} onChange={(e) => setLoad({ ...load, trailer_number: e.target.value })} />
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <label>
            <div>Status</div>
            <select value={load.status} onChange={(e) => setLoad({ ...load, status: e.target.value })}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={saveLoad} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Assign Driver</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={load.driver_id ?? ""} onChange={(e) => assignDriver(Number(e.target.value))}>
            <option value="">Select driver...</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.first_name} {driver.last_name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Audit Log</h2>
        {auditLogs.length === 0 ? (
          <p>No audit logs yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ padding: 8, border: "1px solid #f1f5f9", borderRadius: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{log.created_at}</div>
                <div>
                  <strong>{log.action}</strong> — {log.resource_type} #{log.resource_id}
                </div>
                {log.details && <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(log.details)}</pre>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
