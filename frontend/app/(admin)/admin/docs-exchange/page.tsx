"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type DocumentExchange = {
  id: number;
  date: string;
  driver_name: string;
  driver_id: number;
  load_id: number;
  load_number?: string;
  type: "BOL" | "Lumper" | "Receipt" | "Other";
  attachment_url: string;
  status: "Pending" | "Accepted" | "Rejected";
  notes?: string;
  created_at: string;
  updated_at: string;
};

type Load = {
  id: number;
  load_number: string;
  pickup: string;
  delivery: string;
};

export default function DocsExchangePage() {
  const [documents, setDocuments] = useState<DocumentExchange[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentExchange | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  useEffect(() => {
    fetchDocuments();
    fetchLoads();
  }, []);

  async function fetchDocuments() {
    try {
      const token = getToken();
      const res = await apiFetch("/pod/documents-exchange", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setDocuments(res || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load documents"));
    }
  }

  async function fetchLoads() {
    try {
      const token = getToken();
      const res = await apiFetch("/loads/", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setLoads(res || []);
    } catch (err) {
      console.error("Failed to load loads:", err);
    }
  }

  async function updateDocumentStatus(docId: number, status: "Accepted" | "Rejected") {
    try {
      const token = getToken();
      await apiFetch(`/pod/documents-exchange/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      
      // Refresh documents
      await fetchDocuments();
      setSelectedDoc(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update document status"));
    }
  }

  async function saveDocumentChanges(docId: number, updates: Partial<DocumentExchange>) {
    try {
      const token = getToken();
      await apiFetch(`/pod/documents-exchange/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      
      await fetchDocuments();
      setSelectedDoc(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save changes"));
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.load_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || doc.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-700 border-green-300";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-300";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
    }
  };

  return (
    <main className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents Exchange</h1>
        <p className="text-gray-600 mt-1">Review and approve driver document submissions</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by driver, load, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">DATE</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">DRIVER</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">TYPE</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">ATTACHMENT</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">LOAD #</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">STATUS</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">NOTES</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">No documents found</p>
                    <p className="text-sm text-gray-400 mt-1">Driver submissions will appear here for review</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(doc.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {doc.driver_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={doc.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        View
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                      {doc.load_number || `#${doc.load_id}`}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full border font-semibold text-xs ${getStatusBadgeColor(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {doc.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Review Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Modify Document</h2>
                  <p className="text-blue-100 mt-1">Review and update document details</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Date and Driver Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDoc.date.split("T")[0]}
                    onChange={(e) => setSelectedDoc({ ...selectedDoc, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                  <input
                    type="text"
                    value={selectedDoc.driver_name}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              {/* Load and Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Load #</label>
                  <select
                    value={selectedDoc.load_id}
                    onChange={(e) =>
                      setSelectedDoc({
                        ...selectedDoc,
                        load_id: parseInt(e.target.value),
                        load_number: loads.find((l) => l.id === parseInt(e.target.value))?.load_number,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {loads.map((load) => (
                      <option key={load.id} value={load.id}>
                        {load.load_number} - {load.pickup} → {load.delivery}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={selectedDoc.type}
                    onChange={(e) =>
                      setSelectedDoc({ ...selectedDoc, type: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="BOL">BOL</option>
                    <option value="Lumper">Lumper</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Driver Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driver comments</label>
                <textarea
                  value={selectedDoc.notes || ""}
                  onChange={(e) => setSelectedDoc({ ...selectedDoc, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add notes or comments..."
                />
              </div>

              {/* Attachments Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedDoc.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedDoc.attachment_url.split("/").pop()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedDoc.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View File
                    </a>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <textarea
                  value={selectedDoc.notes || ""}
                  onChange={(e) => setSelectedDoc({ ...selectedDoc, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Internal notes..."
                />
              </div>

              {/* History Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">History</h3>
                <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(selectedDoc.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-gray-600">
                      {new Date(selectedDoc.created_at).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-900 font-medium">
                      Submitted: Load #{selectedDoc.load_number}, Type: {selectedDoc.type}
                    </span>
                  </div>
                  {selectedDoc.status === "Accepted" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(selectedDoc.updated_at).toLocaleDateString()}
                      </span>
                      <span className="text-gray-600">
                        {new Date(selectedDoc.updated_at).toLocaleTimeString()}
                      </span>
                      <span className="text-green-700 font-medium">
                        Accepted: Load #{selectedDoc.load_number}, Type: {selectedDoc.type}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-between border-t">
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${getStatusBadgeColor(selectedDoc.status)}`}>
                  {selectedDoc.status}
                </span>
              </div>
              <div className="flex gap-3">
                {selectedDoc.status === "Pending" && (
                  <>
                    <button
                      onClick={() => updateDocumentStatus(selectedDoc.id, "Accepted")}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept
                    </button>
                    <button
                      onClick={() => updateDocumentStatus(selectedDoc.id, "Rejected")}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => saveDocumentChanges(selectedDoc.id, selectedDoc)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
