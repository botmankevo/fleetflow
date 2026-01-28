"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type PodHistory = {
  id: number;
  load_id: number;
  load_number?: string | null;
  uploaded_by_email?: string | null;
  file_links: string[];
  signature_link?: string | null;
  created_at: string;
};

export default function AdminPodHistoryPage() {
  const [items, setItems] = useState<PodHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const token = getToken();
      const res = await apiFetch("/pod/history", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setItems(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load POD history"));
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">POD History</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {items.length === 0 && <div className="text-xs text-slate">No PODs yet.</div>}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-gold">Load {item.load_number || item.load_id}</div>
              <div className="text-xs text-slate">{new Date(item.created_at).toLocaleString()}</div>
            </div>
            <div className="text-xs text-slate">Uploaded by: {item.uploaded_by_email || "Unknown"}</div>
            <div className="text-xs text-slate">Files: {item.file_links.length}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {item.file_links.map((link) => (
                <a key={link} className="link" href={link} target="_blank" rel="noreferrer">
                  File
                </a>
              ))}
              {item.signature_link ? (
                <a className="link" href={item.signature_link} target="_blank" rel="noreferrer">
                  Signature
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
