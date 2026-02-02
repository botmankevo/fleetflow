"use client";

import { ResizableTable } from "../../../../components/ui/resizable-table";

export default function VendorManagement() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vendors</h1>
                    <p className="text-slate-500 mt-1">Manage maintenance shops, parts suppliers, and service providers</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all">
                    + Add Vendor
                </button>
            </div>

            <div className="h-[600px]">
                <ResizableTable title="All Vendors" />
            </div>
        </main>
    );
}
