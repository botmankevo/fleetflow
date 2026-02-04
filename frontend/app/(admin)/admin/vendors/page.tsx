"use client";

import { useState } from "react";
import { ResizableTable } from "../../../../components/ui/resizable-table";
import ImportModal from "../../../../components/ImportModal";
import { getToken } from "../../../../lib/api";

export default function VendorManagement() {
    const [showImportModal, setShowImportModal] = useState(false);

    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vendors</h1>
                    <p className="text-slate-500 mt-1">Manage maintenance shops, parts suppliers, and service providers</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2.5 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import Vendors
                    </button>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all">
                        + Add Vendor
                    </button>
                </div>
            </div>

            <div className="h-[600px]">
                <ResizableTable title="All Vendors" />
            </div>

            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                title="Import Vendors"
                entityType="vendors"
                onImport={handleImportVendors}
            />
        </main>
    );
}

async function handleImportVendors(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const response = await fetch("http://localhost:8000/imports/vendors", {
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

    window.location.reload();
}
