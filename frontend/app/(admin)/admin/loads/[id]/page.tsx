"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getErrorMessage, getToken } from "../../../../../lib/api";

type Load = {
  id: number;
  load_number?: string | null;
  status?: string | null;
  pickup_address?: string | null;
  delivery_address?: string | null;
  notes?: string | null;
  driver_id?: number | null;
};

type Driver = {
  id: number;
  name: string;
  email?: string | null;
};

type LedgerLine = {
  id: number;
  category: string;
  description?: string | null;
  amount: number;
  locked_at?: string | null;
  settlement_id?: number | null;
};

type PayeeLedger = {
  payee_id: number;
  payee_name: string;
  payee_type: string;
  subtotal: number;
  lines: LedgerLine[];
};

type LoadPayLedger = {
  load_id: number;
  currency: string;
  by_payee: PayeeLedger[];
  load_pay_total: number;
};

export default function AdminLoadDetail() {
  const params = useParams();
  const loadId = params?.id as string;
  const [load, setLoad] = useState<Load | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payLedger, setPayLedger] = useState<LoadPayLedger | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const me = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (me?.role !== "admin" && me?.role !== "dispatcher") {
          router.replace("/driver");
          return;
        }
        const driverRes = await apiFetch("/drivers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDrivers(driverRes);
        const res = await apiFetch(`/loads/${loadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoad(res);
        const ledger = await apiFetch(`/loads/${loadId}/pay-ledger`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayLedger(ledger);
        setReady(true);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load"));
      }
    })();
  }, [loadId, router]);

  async function recalcPay() {
    try {
      const token = getToken();
      await apiFetch(`/loads/${loadId}/recalculate-pay`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const ledger = await apiFetch(`/loads/${loadId}/pay-ledger`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayLedger(ledger);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to recalculate pay"));
    }
  }

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
        body: JSON.stringify({
          load_number: load.load_number,
          status: load.status,
          pickup_address: load.pickup_address,
          delivery_address: load.delivery_address,
          notes: load.notes,
          driver_id: load.driver_id,
        }),
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !load) {
    return (
      <main className="p-6">
        <div className="text-slate">Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <Link className="link" href="/admin/loads">{"<- Back"}</Link>
        <div className="text-right">
          <h1 className="text-xl text-gold">Load {load.load_number || load.id}</h1>
          <div className="text-xs text-slate">
            Driver: {drivers.find((d) => d.id === load.driver_id)?.name || "Unassigned"}
          </div>
          <div className="text-xs text-slate">Status: {load.status || "Unknown"}</div>
        </div>
      </header>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="card space-y-3">
        <input
          className="input w-full"
          placeholder="Load #"
          value={load.load_number || ""}
          onChange={(e) => setLoad({ ...load, load_number: e.target.value })}
        />
        <input
          className="input w-full"
          placeholder="Status"
          value={load.status || ""}
          onChange={(e) => setLoad({ ...load, status: e.target.value })}
        />
        <select
          className="input w-full"
          value={load.driver_id ?? ""}
          onChange={(e) =>
            setLoad({
              ...load,
              driver_id: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Assign Driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}{d.email ? ` (${d.email})` : ""}
            </option>
          ))}
        </select>
        <input
          className="input w-full"
          placeholder="Pickup Address"
          value={load.pickup_address || ""}
          onChange={(e) => setLoad({ ...load, pickup_address: e.target.value })}
        />
        <input
          className="input w-full"
          placeholder="Delivery Address"
          value={load.delivery_address || ""}
          onChange={(e) => setLoad({ ...load, delivery_address: e.target.value })}
        />
        <textarea
          className="input w-full"
          rows={4}
          placeholder="Notes"
          value={load.notes || ""}
          onChange={(e) => setLoad({ ...load, notes: e.target.value })}
        />
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg text-gold">Drivers Payable (Grouped by Payee)</h2>
            <p className="text-xs text-slate">Ledger lines are grouped per payee with subtotals.</p>
          </div>
          <button className="btn" onClick={recalcPay}>
            Recalculate
          </button>
        </div>

        {!payLedger && <div className="text-xs text-slate">Loading pay ledger...</div>}
        {payLedger?.by_payee.map((payee) => (
          <div key={payee.payee_id} className="border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white font-semibold">{payee.payee_name}</div>
                <div className="text-xs text-slate">Type: {payee.payee_type}</div>
              </div>
              <div className="text-sm text-emerald-300 font-semibold">
                Subtotal: ${payee.subtotal.toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              {payee.lines.map((line) => (
                <div key={line.id} className="flex items-center justify-between text-xs border border-white/5 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-white/90">{line.description || line.category}</div>
                    <div className="text-slate/80">{line.category}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {line.locked_at && (
                      <span className="text-amber-300 text-[11px]">Locked</span>
                    )}
                    <span className={line.amount >= 0 ? "text-emerald-300" : "text-rose-300"}>
                      {line.amount >= 0 ? "+" : ""}${line.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {payLedger && (
          <div className="flex items-center justify-end text-sm text-white font-semibold">
            Load Pay Total: ${payLedger.load_pay_total.toFixed(2)}
          </div>
        )}
      </section>
    </main>
  );
}
