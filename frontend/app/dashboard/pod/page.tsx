"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, getToken, getUserFromToken } from "@/src/lib/api";

type Load = {
  id: number;
  load_number: string;
};

export default function PodSubmitPage() {
  const token = useMemo(() => getToken(), []);
  const role = getUserFromToken()?.role;
  const [loads, setLoads] = useState<Load[]>([]);
  const [loadId, setLoadId] = useState<string>("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverSignature, setReceiverSignature] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await apiFetch("/tenant/loads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoads(data);
      } catch {
        // ignore
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!loadId || !files || files.length === 0) {
      setError("Select a load and at least one file.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const payload = {
      receiver_name: receiverName,
      receiver_signature: receiverSignature,
      delivery_date: deliveryDate,
      delivery_notes: deliveryNotes || null,
    };

    const formData = new FormData();
    formData.append("request", JSON.stringify(payload));
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const data = await apiFetch(`/tenant/loads/${loadId}/pod/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setMessage(`POD submitted. PDF link: ${data?.pdf_link ?? "n/a"}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit POD");
    } finally {
      setSubmitting(false);
    }
  }

  if (
    role &&
    role !== "driver" &&
    role !== "tenant_admin" &&
    role !== "dispatcher" &&
    role !== "platform_owner"
  ) {
    return (
      <main style={{ padding: 24 }}>
        <p>Access denied.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0 }}>POD Submission</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 640 }}>
        <label>
          <div>Load</div>
          <select value={loadId} onChange={(e) => setLoadId(e.target.value)} required>
            <option value="">Select load...</option>
            {loads.map((load) => (
              <option key={load.id} value={load.id}>
                {load.load_number}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div>Receiver Name</div>
          <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} required />
        </label>

        <label>
          <div>Receiver Signature (text)</div>
          <input value={receiverSignature} onChange={(e) => setReceiverSignature(e.target.value)} required />
        </label>

        <label>
          <div>Delivery Date</div>
          <input value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
        </label>

        <label>
          <div>Delivery Notes</div>
          <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} rows={3} />
        </label>

        <label>
          <div>Files (BOL + photos)</div>
          <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit POD"}
        </button>

        {message && <div style={{ color: "green" }}>{message}</div>}
        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>
    </main>
  );
}
