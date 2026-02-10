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

type DocumentExchange = {
  id: number;
  date: string;
  driver_name: string;
  type: "BOL" | "Lumper" | "Receipt" | "Other";
  attachment_url: string;
  status: string;
  notes?: string;
  created_at: string;
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

type PassThroughLine = {
  id: number;
  category: string;
  description?: string | null;
  amount: number;
  destination_payee_id?: number | null;
  destination_payee_name?: string | null;
  source_payee_id?: number | null;
  source_payee_name?: string | null;
  locked_at?: string | null;
  settlement_id?: number | null;
};

type PayeeLedger = {
  payee_id: number;
  payee_name: string;
  payee_type: string;
  payable_to: string;
  driver_kind?: string | null;
  subtotal: number;
  lines: LedgerLine[];
  pass_through_deductions: PassThroughLine[];
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
  const [documents, setDocuments] = useState<DocumentExchange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "documents" | "billing" | "history">("documents");
  const router = useRouter();
  const [ready, setReady] = useState(false);
  
  // Add Pay modal state
  const [showAddPayModal, setShowAddPayModal] = useState(false);
  const [selectedPayeeId, setSelectedPayeeId] = useState<number | null>(null);
  const [payCategory, setPayCategory] = useState("driver_pay");
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");
  
  // Add Pass-Through modal state
  const [showPassThroughModal, setShowPassThroughModal] = useState(false);
  const [ptSourcePayeeId, setPtSourcePayeeId] = useState<number | null>(null);
  const [ptDestPayeeId, setPtDestPayeeId] = useState<number | null>(null);
  const [ptAmount, setPtAmount] = useState("");
  const [ptDescription, setPtDescription] = useState("");

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
        
        // Fetch documents for this load
        try {
          const docs = await apiFetch(`/loads/${loadId}/documents`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDocuments(docs || []);
        } catch (err) {
          console.log("No documents yet or endpoint not ready");
        }
        
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

  async function addPayLine() {
    if (!selectedPayeeId || !payAmount) return;
    
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch(`/loads/${loadId}/add-pay-line?payee_id=${selectedPayeeId}&category=${encodeURIComponent(payCategory)}&amount=${payAmount}&description=${encodeURIComponent(payDescription || '')}`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      
      // Refresh pay ledger
      const ledger = await apiFetch(`/loads/${loadId}/pay-ledger`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayLedger(ledger);
      
      // Reset form and close modal
      setShowAddPayModal(false);
      setSelectedPayeeId(null);
      setPayCategory("driver_pay");
      setPayAmount("");
      setPayDescription("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add pay line"));
    } finally {
      setSaving(false);
    }
  }

  async function addPassThrough() {
    if (!ptSourcePayeeId || !ptDestPayeeId || !ptAmount) return;
    
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch(`/loads/${loadId}/add-pass-through-deduction?source_payee_id=${ptSourcePayeeId}&destination_payee_id=${ptDestPayeeId}&amount=${ptAmount}&description=${encodeURIComponent(ptDescription || 'Pass-through')}`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      
      // Refresh pay ledger
      const ledger = await apiFetch(`/loads/${loadId}/pay-ledger`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayLedger(ledger);
      
      // Reset form and close modal
      setShowPassThroughModal(false);
      setPtSourcePayeeId(null);
      setPtDestPayeeId(null);
      setPtAmount("");
      setPtDescription("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add pass-through deduction"));
    } finally {
      setSaving(false);
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

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("services")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "services"
                ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "documents"
                ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "billing"
                ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Load Services</h3>
              <div className="text-sm text-gray-600">
                Services and additional charges for this load will appear here.
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                No services added yet
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload confirmation
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload BOL
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Other Document
                  </button>
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No documents yet</p>
                  <p className="text-sm text-gray-500 mt-1">Documents uploaded by drivers will appear here after approval</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">DATE</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">TYPE</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ATTACHMENT NAME</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">NOTES</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(doc.date).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              doc.type === "BOL" ? "bg-blue-100 text-blue-700" :
                              doc.type === "Lumper" ? "bg-green-100 text-green-700" :
                              doc.type === "Receipt" ? "bg-purple-100 text-purple-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {doc.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 hover:text-blue-800">
                            <a href={doc.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              {doc.attachment_url.split("/").pop()}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {doc.notes || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button className="text-green-600 hover:text-green-800 p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button className="text-red-600 hover:text-red-800 p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {documents.length > 0 && (
                <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Merge documents
                </button>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Invoice Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invoice: {load.load_number}</h3>
                    <p className="text-sm text-gray-600">
                      To: {load.customer_name || "ACERTUS (FKA RCG LOGISTICS LLC)"} / Direct billing
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Download as PDF
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Email
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Export to QB
                    </button>
                  </div>
                </div>

                {/* Invoice Line Items */}
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">DATE</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">DESCRIPTION</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {load.pickup_date || "12/19/25"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          Miles: {load.pickup_address} - {load.delivery_address} distance: 223mi/30mi
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">$350.00</td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">
                          TOTAL
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">$350.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Create invoice
                  </button>
                  <div className="relative inline-block">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2">
                      Recalculate
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drivers Payable Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Drivers Payable
                    <button className="text-green-600 hover:text-green-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </h3>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                    Additional Deductions
                  </button>
                </div>

                {!payLedger && <div className="text-sm text-gray-600">Loading pay ledger...</div>}
                
                {/* Locked Lines Warning */}
                {payLedger && payLedger.by_payee.some(p => p.lines.some(l => l.locked_at)) && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">This load has locked pay lines</h4>
                        <p className="text-sm text-amber-800 mt-1">
                          Some lines have been included in paid settlements and cannot be modified. 
                          If you need to make changes, adjustments will be created in the next pay period.
                        </p>
                        <div className="mt-2 text-xs text-amber-700">
                          🔒 Locked lines will appear with a lock icon and yellow background
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Adjustment Lines Notice */}
                {payLedger && payLedger.by_payee.some(p => p.lines.some(l => l.category === 'adjustment')) && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">ℹ️</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">Adjustments Detected</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          This load has adjustment lines created due to changes made after a settlement was paid.
                          These adjustments will be included in the next pay period.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {payLedger?.by_payee.map((payee) => (
                  <div key={payee.payee_id} className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    {/* Payee Header */}
                    <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Payee: {payee.payee_name}</h4>
                        <p className="text-sm text-gray-600">
                          ({payee.driver_kind ? payee.driver_kind.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : payee.payee_type.charAt(0).toUpperCase() + payee.payee_type.slice(1)} / Payable-To: {payee.payable_to})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedPayeeId(payee.payee_id);
                            setShowAddPayModal(true);
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Pay
                        </button>
                        <button 
                          onClick={() => {
                            setPtSourcePayeeId(payee.payee_id);
                            setShowPassThroughModal(true);
                          }}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Pass-Through
                        </button>
                      </div>
                    </div>
                    
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">DATE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">DESCRIPTION</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* Regular Line Items */}
                        {payee.lines.map((line) => (
                          <tr key={line.id} className={`hover:bg-gray-50 ${line.locked_at ? 'bg-yellow-50' : ''}`}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {load.pickup_date || new Date().toLocaleDateString()}
                              {line.locked_at && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-amber-600">🔒 Locked</span>
                                  {line.settlement_id && (
                                    <span className="text-xs text-gray-500">
                                      (Settlement #{line.settlement_id})
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-blue-600">{line.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                {line.locked_at && (
                                  <span title={`Locked on ${new Date(line.locked_at).toLocaleString()}`} className="cursor-help">
                                    🔒
                                  </span>
                                )}
                              </div>
                              {line.description && <span className="text-gray-600"> - {line.description}</span>}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${line.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {line.amount >= 0 ? "" : "-"}${Math.abs(line.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        
                        {/* Pass-Through Deductions Section */}
                        {payee.pass_through_deductions && payee.pass_through_deductions.length > 0 && (
                          <>
                            <tr className="bg-gray-100">
                              <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                                Pass-Through Deductions
                              </td>
                            </tr>
                            {payee.pass_through_deductions.map((pt) => (
                              <tr key={pt.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date().toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <span className="font-medium text-purple-600">{pt.description}</span>
                                  {pt.destination_payee_name && (
                                    <span className="text-gray-500 ml-2">→ {pt.destination_payee_name}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-rose-600">
                                  -${Math.abs(pt.amount).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                        
                        {/* Subtotal Row */}
                        <tr className="bg-yellow-50">
                          <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">
                            SUBTOTAL
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            ${payee.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}

                {payLedger && payLedger.by_payee.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No driver payables yet
                  </div>
                )}
                
                {/* Load-Wide Total */}
                {payLedger && payLedger.by_payee.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Load-Wide Total Payables</h3>
                        <p className="text-sm text-gray-600">Sum of all payee subtotals for this load</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">
                          ${payLedger.load_pay_total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {payLedger.by_payee.length} {payLedger.by_payee.length === 1 ? 'payee' : 'payees'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Optional: Breakdown by payee */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {payLedger.by_payee.map((payee) => (
                          <div key={payee.payee_id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600">{payee.payee_name}</div>
                            <div className="text-lg font-semibold text-gray-900">${payee.subtotal.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Payable Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Other Payable
                    <button className="text-green-600 hover:text-green-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </h3>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">DATE</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">DESCRIPTION</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                          No records
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Load History</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{new Date().toLocaleDateString()}</span>
                    <span className="text-gray-600">{new Date().toLocaleTimeString()}</span>
                    <span className="text-gray-900 font-medium">Load created</span>
                  </div>
                </div>
                {load.status && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{new Date().toLocaleDateString()}</span>
                      <span className="text-gray-600">{new Date().toLocaleTimeString()}</span>
                      <span className="text-gray-900 font-medium">Status changed to: {load.status}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Pay Modal */}
      {showAddPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Pay Line Item</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={payCategory}
                  onChange={(e) => setPayCategory(e.target.value)}
                >
                  <option value="driver_pay">Driver Pay</option>
                  <option value="fuel_advance">Fuel Advance</option>
                  <option value="bonus">Bonus</option>
                  <option value="deduction">Deduction</option>
                  <option value="equipment_lease">Equipment Lease</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={payDescription}
                  onChange={(e) => setPayDescription(e.target.value)}
                  placeholder="e.g., Load payment for #1145"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddPayModal(false);
                  setSelectedPayeeId(null);
                  setPayCategory("driver_pay");
                  setPayAmount("");
                  setPayDescription("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={addPayLine}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                disabled={saving || !payAmount}
              >
                {saving ? "Adding..." : "Add Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pass-Through Deduction Modal */}
      {showPassThroughModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Pass-Through Deduction</h3>
            <p className="text-sm text-gray-600 mb-4">
              Deduct from one payee and pass through to another (e.g., truck lease, equipment rental)
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From (Source Payee)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={ptSourcePayeeId || ""}
                  onChange={(e) => setPtSourcePayeeId(Number(e.target.value))}
                >
                  <option value="">Select source payee</option>
                  {payLedger?.by_payee.map((payee) => (
                    <option key={payee.payee_id} value={payee.payee_id}>
                      {payee.payee_name} ({payee.payee_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center py-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To (Destination Payee)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={ptDestPayeeId || ""}
                  onChange={(e) => setPtDestPayeeId(Number(e.target.value))}
                >
                  <option value="">Select destination payee</option>
                  {payLedger?.by_payee
                    .filter(p => p.payee_id !== ptSourcePayeeId)
                    .map((payee) => (
                      <option key={payee.payee_id} value={payee.payee_id}>
                        {payee.payee_name} ({payee.payee_type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={ptAmount}
                  onChange={(e) => setPtAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={ptDescription}
                  onChange={(e) => setPtDescription(e.target.value)}
                  placeholder="e.g., Truck Lease, Trailer Rental"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPassThroughModal(false);
                  setPtSourcePayeeId(null);
                  setPtDestPayeeId(null);
                  setPtAmount("");
                  setPtDescription("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={addPassThrough}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                disabled={saving || !ptSourcePayeeId || !ptDestPayeeId || !ptAmount}
              >
                {saving ? "Adding..." : "Add Pass-Through"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
