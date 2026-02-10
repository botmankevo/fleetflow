"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";
import ImportModal from "../../../../components/ImportModal";

const TABS = ["Documents", "Pay rates", "Scheduled payments/deductions", "Additional payee", "Notes", "Driver App"] as const;

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    name: "",
    email: "",
    phone: "",
    license_number: "",
    license_state: "",
    license_expiry: "",
  });

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

  async function handleCreateDriver() {
    try {
      const token = getToken();
      await apiFetch("/drivers", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: JSON.stringify(newDriverData),
      });
      setShowCreateModal(false);
      setNewDriverData({
        name: "",
        email: "",
        phone: "",
        license_number: "",
        license_state: "",
        license_expiry: "",
      });
      fetchDrivers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create driver"));
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-gold">Drivers</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-card/10 border border-white/20 text-white rounded-lg hover:bg-card/20 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn"
          >
            New
          </button>
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
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
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
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Documents Summary</h3>
                  <button 
                    className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                    onClick={() => setActiveTab("Documents")}
                  >
                    Manage Documents →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {activeDriver.documents.slice(0, 6).map((doc) => {
                    const isExpiringSoon = doc.expires_at && new Date(doc.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date();
                    
                    return (
                      <div key={doc.id} className={`border rounded-lg p-2 text-xs ${
                        isExpired ? 'border-red-200 bg-red-50' :
                        isExpiringSoon ? 'border-amber-200 bg-amber-50' :
                        doc.status === 'active' ? 'border-green-200 bg-green-50' :
                        'border-slate-200 bg-slate-50'
                      }`}>
                        <div className="font-semibold text-gray-900">{doc.doc_type}</div>
                        <div className={`text-xs mt-1 ${
                          isExpired ? 'text-red-600' :
                          isExpiringSoon ? 'text-amber-600' :
                          doc.status === 'active' ? 'text-green-600' :
                          'text-slate-500'
                        }`}>
                          {isExpired ? '⚠️ Expired' :
                           isExpiringSoon ? '⏰ Expiring Soon' :
                           doc.status === 'active' ? '✓ Active' :
                           doc.status === 'missing' ? '✗ Missing' :
                           doc.status}
                        </div>
                      </div>
                    );
                  })}
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
                  {activeTab === "Documents" && (
                    <DocumentsTab driver={activeDriver} onUpdate={() => openDriver(activeDriver.id)} />
                  )}

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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Driver</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newDriverData.name}
                  onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Manuel Garcia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newDriverData.email}
                  onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="manuel@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newDriverData.phone}
                  onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={newDriverData.license_number}
                  onChange={(e) => setNewDriverData({ ...newDriverData, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="DL123456"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License State</label>
                  <input
                    type="text"
                    value={newDriverData.license_state}
                    onChange={(e) => setNewDriverData({ ...newDriverData, license_state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="TX"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                  <input
                    type="date"
                    value={newDriverData.license_expiry}
                    onChange={(e) => setNewDriverData({ ...newDriverData, license_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDriver}
                disabled={!newDriverData.name}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Driver
              </button>
            </div>
          </div>
        </div>
      )}
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

// Documents Tab Component
function DocumentsTab({ driver, onUpdate }: { driver: DriverDetail; onUpdate: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const REQUIRED_DOCUMENTS = [
    "Application",
    "CDL",
    "Medical Card",
    "Drug Test",
    "MVR",
    "SSN Card",
    "Employment Verification",
    "Road Test",
    "Annual Review",
    "Clearinghouse Query"
  ];

  function getDocumentStatus(docType: string) {
    const doc = driver.documents.find(d => d.doc_type === docType);
    if (!doc) return { status: "missing", color: "bg-gray-100 text-gray-600", expires: null };
    
    const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date();
    const isExpiringSoon = doc.expires_at && new Date(doc.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (isExpired) return { status: "expired", color: "bg-red-100 text-red-800", expires: doc.expires_at };
    if (isExpiringSoon) return { status: "expiring soon", color: "bg-amber-100 text-amber-800", expires: doc.expires_at };
    if (doc.status === "active") return { status: "active", color: "bg-green-100 text-green-800", expires: doc.expires_at };
    if (doc.status === "complete") return { status: "complete", color: "bg-blue-100 text-blue-800", expires: doc.expires_at };
    
    return { status: doc.status, color: "bg-gray-100 text-gray-600", expires: doc.expires_at };
  }

  async function handleUpload(file: File, docType: string, expiresAt?: string) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      if (expiresAt) formData.append("expires_at", expiresAt);

      const token = getToken();
      const response = await fetch(`http://localhost:8000/drivers/${driver.id}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setShowUploadModal(false);
      onUpdate();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to upload document"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Required Driver Documents</h4>
        <button
          onClick={() => {
            setSelectedDocType("");
            setShowUploadModal(true);
          }}
          className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90"
        >
          + Upload Document
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {REQUIRED_DOCUMENTS.map((docType) => {
          const { status, color, expires } = getDocumentStatus(docType);
          const doc = driver.documents.find(d => d.doc_type === docType);
          
          return (
            <div key={docType} className={`border rounded-lg p-3 ${
              status === "expired" ? "border-red-300" :
              status === "expiring soon" ? "border-amber-300" :
              status === "active" ? "border-green-300" :
              "border-gray-200"
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{docType}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>
                    {status === "expired" && "⚠️ "}{status === "expiring soon" && "⏰ "}{status === "active" && "✓ "}
                    {status.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDocType(docType);
                    setShowUploadModal(true);
                  }}
                  className="text-primary hover:text-primary/90 text-xs"
                >
                  {doc ? "Update" : "Upload"}
                </button>
              </div>
              
              {expires && (
                <div className="text-xs text-gray-600 mt-2">
                  Expires: <span className="font-medium">{new Date(expires).toLocaleDateString()}</span>
                  {status === "expiring soon" && (
                    <span className="text-amber-600 ml-2">
                      ({Math.ceil((new Date(expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days)
                    </span>
                  )}
                </div>
              )}
              
              {doc?.attachment_url && (
                <a
                  href={doc.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  View Document →
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          docType={selectedDocType}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}
    </div>
  );
}

// Upload Document Modal
function UploadDocumentModal({
  docType,
  onClose,
  onUpload,
  uploading
}: {
  docType: string;
  onClose: () => void;
  onUpload: (file: File, docType: string, expiresAt?: string) => void;
  uploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState(docType);
  const [expiresAt, setExpiresAt] = useState("");
  const [hasExpiration, setHasExpiration] = useState(false);

  const DOCUMENT_TYPES = [
    "Application",
    "CDL",
    "Medical Card",
    "Drug Test",
    "MVR",
    "SSN Card",
    "Employment Verification",
    "Road Test",
    "Annual Review",
    "Clearinghouse Query",
    "Other"
  ];

  const EXPIRABLE_DOCS = ["CDL", "Medical Card", "MVR", "Clearinghouse Query"];

  useEffect(() => {
    if (EXPIRABLE_DOCS.includes(selectedType)) {
      setHasExpiration(true);
    }
  }, [selectedType]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Driver Document</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type...</option>
              {DOCUMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
          </div>

          {hasExpiration && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (file && selectedType) {
                onUpload(file, selectedType, expiresAt || undefined);
              }
            }}
            disabled={!file || !selectedType || uploading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
