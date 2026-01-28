"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type Expense = {
  id: number;
  amount: number;
  category?: string | null;
  description?: string | null;
  occurred_at?: string | null;
  receipt_link?: string | null;
  driver_id?: number | null;
};

type Driver = {
  id: number;
  name: string;
  email?: string | null;
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    occurredAt: "",
    driverId: "",
    receipt: null as File | null,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const token = getToken();
      const [exp, drv] = await Promise.all([
        apiFetch("/expenses", { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
        apiFetch("/drivers", { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
      ]);
      setExpenses(exp);
      setDrivers(drv);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load expenses"));
    }
  }

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = getToken();
      const created = await apiFetch("/expenses", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(form.amount || 0),
          category: form.category || null,
          description: form.description || null,
          occurred_at: form.occurredAt ? new Date(form.occurredAt).toISOString() : null,
          driver_id: form.driverId ? Number(form.driverId) : null,
        }),
      });
      if (form.receipt) {
        const data = new FormData();
        data.append("file", form.receipt);
        await apiFetch(`/expenses/${created.id}/receipt`, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: data,
        });
      }
      setForm({ amount: "", category: "", description: "", occurredAt: "", driverId: "", receipt: null });
      await fetchAll();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create expense"));
    } finally {
      setCreating(false);
    }
  }

  async function uploadReceipt(expenseId: number, file: File) {
    try {
      setUploadingId(expenseId);
      const token = getToken();
      const data = new FormData();
      data.append("file", file);
      await apiFetch(`/expenses/${expenseId}/receipt`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: data,
      });
      await fetchAll();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload receipt"));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">Expenses</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Create Expense</h2>
        <form onSubmit={createExpense} className="grid gap-3">
          <input
            className="input w-full"
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <input
            className="input w-full"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
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
            type="file"
            onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0] || null })}
          />
          <button className="btn" disabled={creating}>
            {creating ? "Creating..." : "Create Expense"}
          </button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">All Expenses</h2>
        {expenses.length === 0 && <div className="text-xs text-slate">No expenses yet.</div>}
        {expenses.map((exp) => (
          <div key={exp.id} className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gold">${exp.amount}</div>
              <div className="text-xs text-slate">{exp.category || "Uncategorized"}</div>
            </div>
            {exp.description && <div className="text-xs text-slate">{exp.description}</div>}
            <div className="text-xs text-slate">
              Driver: {drivers.find((d) => d.id === exp.driver_id)?.name || "Unassigned"}
            </div>
            {exp.receipt_link ? (
              <a className="link text-xs" href={exp.receipt_link} target="_blank" rel="noreferrer">
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
                if (file) uploadReceipt(exp.id, file);
              }}
              disabled={uploadingId === exp.id}
            />
          </div>
        ))}
      </section>
    </main>
  );
}
