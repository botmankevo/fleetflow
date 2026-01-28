"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type Maintenance = {
  id: number;
  unit?: string | null;
  description?: string | null;
  cost: number;
  occurred_at?: string | null;
  receipt_link?: string | null;
};

export default function AdminMaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    unit: "",
    description: "",
    cost: "",
    occurredAt: "",
    receipt: null as File | null,
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const token = getToken();
      const res = await apiFetch("/maintenance", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setRecords(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load maintenance records"));
    }
  }

  async function createRecord(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = getToken();
      const created = await apiFetch("/maintenance", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unit: form.unit || null,
          description: form.description || null,
          cost: Number(form.cost || 0),
          occurred_at: form.occurredAt ? new Date(form.occurredAt).toISOString() : null,
        }),
      });
      if (form.receipt) {
        const data = new FormData();
        data.append("file", form.receipt);
        await apiFetch(`/maintenance/${created.id}/receipt`, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: data,
        });
      }
      setForm({ unit: "", description: "", cost: "", occurredAt: "", receipt: null });
      await fetchRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create maintenance record"));
    } finally {
      setCreating(false);
    }
  }

  async function uploadReceipt(recordId: number, file: File) {
    try {
      setUploadingId(recordId);
      const token = getToken();
      const data = new FormData();
      data.append("file", file);
      await apiFetch(`/maintenance/${recordId}/receipt`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: data,
      });
      await fetchRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload receipt"));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">Maintenance</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Create Maintenance</h2>
        <form onSubmit={createRecord} className="grid gap-3">
          <input
            className="input w-full"
            placeholder="Unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <input
            className="input w-full"
            type="number"
            placeholder="Cost"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
          />
          <input
            className="input w-full"
            type="date"
            value={form.occurredAt}
            onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
          />
          <textarea
            className="input w-full"
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="input w-full"
            type="file"
            onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0] || null })}
          />
          <button className="btn" disabled={creating}>
            {creating ? "Creating..." : "Create Maintenance"}
          </button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Maintenance Records</h2>
        {records.length === 0 && <div className="text-xs text-slate">No records yet.</div>}
        {records.map((rec) => (
          <div key={rec.id} className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gold">{rec.unit || "Unit"}</div>
              <div className="text-xs text-slate">${rec.cost}</div>
            </div>
            {rec.description && <div className="text-xs text-slate">{rec.description}</div>}
            {rec.receipt_link ? (
              <a className="link text-xs" href={rec.receipt_link} target="_blank" rel="noreferrer">
                View receipt
              </a>
            ) : (
              <div className="text-xs text-slate">No receipt</div>
            )}
            <input
              className="input w-full"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadReceipt(rec.id, file);
              }}
              disabled={uploadingId === rec.id}
            />
          </div>
        ))}
      </section>
    </main>
  );
}
