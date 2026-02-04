"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";
import ImportModal from "../../../../components/ImportModal";

const TABS = ["Pay rates", "Scheduled payments/deductions", "Additional payee", "Notes", "Driver App"] as const;

type Driver = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  pay_profile?: { pay_type: string; rate: number; driver_kind: string } | null;
  payee?: { name: string } | null;
};

type DriverDetail = Driver & {
  documents: {
    id: number;
    doc_type: string;
    status: string;
    expires_at?: string | null;
    attachment_url?: string | null;
  }[];
  additional_payees: {
    id: number;
    pay_rate_percent: number;
    payee: { name: string; payee_type: string };
  }[];
  recurring_items: {
    id: number;
    item_type: string;
    amount: number;
    schedule: string;
    next_date?: string | null;
    description?: string | null;
  }[];
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeDriver, setActiveDriver] = useState<DriverDetail | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Pay rates");
  const [showImportModal, setShowImportModal] = useState(false);

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

  async function openDriver(driverId: number) {
    try {
      const token = getToken();
      const res = await apiFetch(`/payroll/drivers/${driverId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setActiveDriver(res);
      setActiveTab("Pay rates");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load driver"));
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-gold">Drivers</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import
          </button>
          <button className="btn">New</button>
        </div>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <section className="card">
        <div className="grid grid-cols-7 gap-4 text-xs text-slate border-b border-white/10 pb-2">
          <div>Name</div>
          <div>Type</div>
          <div>Status</div>
          <div>Phone</div>
          <div>Email</div>
          <div>Payable To</div>
          <div>Actions</div>
        </div>
        <div className="divide-y divide-white/5">
          {drivers.map((driver) => (
            <div key={driver.id} className="grid grid-cols-7 gap-4 py-3 text-sm">
              <div className="text-emerald-200 font-semibold">{driver.name}</div>
              <div className="text-slate">
                {driver.pay_profile?.driver_kind === "owner_operator" ? "Own" : "Drv"}
              </div>
              <div className="text-emerald-300">Hired</div>
              <div className="text-slate">{driver.phone || "-"}</div>
              <div className="text-slate">{driver.email || "-"}</div>
              <div className="text-slate">{driver.payee?.name || driver.name}</div>
              <div>
                <button className="btn" onClick={() => openDriver(driver.id)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {activeDriver && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Driver</h2>
              <button className="text-slate-500" onClick={() => setActiveDriver(null)}>
                X
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate">Name</label>
                  <div className="input w-full">{activeDriver.name}</div>
                </div>
                <div>
                  <label className="text-xs text-slate">Payable to</label>
                  <div className="input w-full">{activeDriver.payee?.name || activeDriver.name}</div>
                </div>
                <div>
                  <label className="text-xs text-slate">Phone</label>
                  <div className="input w-full">{activeDriver.phone || "-"}</div>
                </div>
                <div>
                  <label className="text-xs text-slate">Email</label>
                  <div className="input w-full">{activeDriver.email || "-"}</div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Documents</h3>
                <div className="space-y-2">
                  {activeDriver.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 text-xs">
                      <div>
                        <div className="font-semibold">{doc.doc_type}</div>
                        <div className="text-slate">{doc.status}</div>
                      </div>
                      <div className="text-slate">{doc.expires_at ? `exp. ${doc.expires_at.split("T")[0]}` : ""}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex gap-3 border-b border-slate-200 text-xs">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      className={`px-3 py-2 ${activeTab === tab ? "text-emerald-600 border-b-2 border-emerald-500" : "text-slate-500"}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="border border-slate-200 rounded-b-lg p-4 text-sm">
                  {activeTab === "Pay rates" && (
                    <div className="space-y-3">
                      <div className="text-xs text-slate">Driver type</div>
                      <div className="text-sm font-semibold">
                        {activeDriver.pay_profile?.driver_kind === "owner_operator" ? "Owner operator" : "Company driver"}
                      </div>
                      <div className="text-xs text-slate">Pay rate</div>
                      <div className="text-sm font-semibold">
                        {activeDriver.pay_profile?.pay_type} {activeDriver.pay_profile?.rate}%
                      </div>
                    </div>
                  )}

                  {activeTab === "Scheduled payments/deductions" && (
                    <div className="space-y-2">
                      {activeDriver.recurring_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs border border-slate-200 rounded-lg p-3">
                          <div>
                            <div className="font-semibold">{item.description || item.item_type}</div>
                            <div className="text-slate">{item.schedule}</div>
                          </div>
                          <div className={item.amount >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {item.amount >= 0 ? "+" : ""}${item.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      {activeDriver.recurring_items.length === 0 && (
                        <div className="text-xs text-slate">No recurring items.</div>
                      )}
                    </div>
                  )}

                  {activeTab === "Additional payee" && (
                    <div className="space-y-2">
                      {activeDriver.additional_payees.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs border border-slate-200 rounded-lg p-3">
                          <div>
                            <div className="font-semibold">{item.payee.name}</div>
                            <div className="text-slate">{item.payee.payee_type}</div>
                          </div>
                          <div className="text-emerald-600">{item.pay_rate_percent}%</div>
                        </div>
                      ))}
                      {activeDriver.additional_payees.length === 0 && (
                        <div className="text-xs text-slate">No additional payees.</div>
                      )}
                    </div>
                  )}

                  {activeTab === "Notes" && (
                    <div className="text-xs text-slate">Copart, IAA, Central</div>
                  )}

                  {activeTab === "Driver App" && (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate">Invite accepted on 02/11/25</div>
                      <button className="btn">Send App Invite</button>
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
              <button className="btn" onClick={() => setActiveDriver(null)}>Close</button>
              <button className="btn">Save</button>
            </div>
          </div>
        </div>
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Drivers"
        entityType="drivers"
        onImport={handleImportDrivers}
      />
    </main>
  );
}

async function handleImportDrivers(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getToken();
  const response = await fetch("http://localhost:8000/imports/drivers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Import failed");
  }

  // Refresh the drivers list after successful import
  window.location.reload();
}
