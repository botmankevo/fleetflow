"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type Payee = {
  id: number;
  name: string;
  payee_type: string;
};

export default function PayrollPage() {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [selectedPayee, setSelectedPayee] = useState<string>("");
  const [periodStart, setPeriodStart] = useState("2026-01-26");
  const [periodEnd, setPeriodEnd] = useState("2026-02-01");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await apiFetch("/payroll/payees", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setPayees(res);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load payees"));
      }
    })();
  }, []);

  async function createSettlement() {
    setError(null);
    setMessage(null);
    try {
      const token = getToken();
      const res = await apiFetch("/payroll/settlements", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payee_id: Number(selectedPayee),
          period_start: new Date(periodStart).toISOString(),
          period_end: new Date(periodEnd).toISOString(),
        }),
      });
      setMessage(`Created settlement #${res.id} (${res.status})`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create settlement"));
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">Driver Payroll</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {message && <div className="text-emerald-300 text-sm">{message}</div>}

      <section className="card space-y-4">
        <h2 className="text-sm text-slate">Create Settlement</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="input w-full"
            value={selectedPayee}
            onChange={(e) => setSelectedPayee(e.target.value)}
          >
            <option value="">Select payee</option>
            {payees.map((payee) => (
              <option key={payee.id} value={payee.id}>
                {payee.name} ({payee.payee_type})
              </option>
            ))}
          </select>
          <input
            className="input w-full"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
          <input
            className="input w-full"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
        <button className="btn" disabled={!selectedPayee} onClick={createSettlement}>
          Create Settlement Draft
        </button>
      </section>
    </main>
  );
}
