"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, getToken } from "../../../../../lib/api";

export default function AdminLoadDetail() {
  const params = useParams();
  const loadId = params?.id as string;
  const [load, setLoad] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await apiFetch(`/loads/${loadId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setLoad(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    })();
  }, [loadId]);

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
        body: JSON.stringify({ fields: load.fields }),
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!load) {
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
        <h1 className="text-xl text-gold">Load {load.fields?.["Load #"] || load.id}</h1>
      </header>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="card space-y-3">
        <input
          className="input w-full"
          placeholder="Load #"
          value={load.fields?.["Load #"] || ""}
          onChange={(e) => setLoad({ ...load, fields: { ...load.fields, "Load #": e.target.value } })}
        />
        <input
          className="input w-full"
          placeholder="Status"
          value={load.fields?.Status || ""}
          onChange={(e) => setLoad({ ...load, fields: { ...load.fields, Status: e.target.value } })}
        />
        <input
          className="input w-full"
          placeholder="Pickup Address"
          value={load.fields?.["Pickup Address"] || ""}
          onChange={(e) => setLoad({ ...load, fields: { ...load.fields, "Pickup Address": e.target.value } })}
        />
        <input
          className="input w-full"
          placeholder="Delivery Address"
          value={load.fields?.["Delivery Address"] || ""}
          onChange={(e) => setLoad({ ...load, fields: { ...load.fields, "Delivery Address": e.target.value } })}
        />
        <textarea
          className="input w-full"
          rows={4}
          placeholder="Notes"
          value={load.fields?.Notes || ""}
          onChange={(e) => setLoad({ ...load, fields: { ...load.fields, Notes: e.target.value } })}
        />
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </main>
  );
}
