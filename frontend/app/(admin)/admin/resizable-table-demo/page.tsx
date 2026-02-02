"use client";

import { ResizableTable } from "../../../../components/ui/resizable-table";

export default function ResizableTableDemo() {
    const handleEmployeeSelect = (employeeId: string) => {
        console.log(`Selected employee:`, employeeId);
    };

    const handleColumnResize = (columnKey: string, newWidth: number) => {
        console.log(`Column ${columnKey} resized to ${newWidth}px`);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12 pt-12">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Component Demo</h1>
                    <p className="mt-2 text-slate-500 text-lg">Testing the new resizable table with sample data from ezloads.net</p>
                </div>

                <div className="h-[600px]">
                    <ResizableTable
                        title="Load Management Dashboard (Sample)"
                        onEmployeeSelect={handleEmployeeSelect}
                        onColumnResize={handleColumnResize}
                    />
                </div>

                <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Implementation Notes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-xs mt-0.5">1</div>
                                <p className="text-slate-600 leading-relaxed">
                                    <strong className="text-slate-900">Interactive Resizing:</strong> Hover over the column edges in the header and drag to adjust width. Widths update in real-time.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-xs mt-0.5">2</div>
                                <p className="text-slate-600 leading-relaxed">
                                    <strong className="text-slate-900">Selection Logic:</strong> Click any row to highlight it. The selected ID is logged to the console for parent component use.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-xs mt-0.5">3</div>
                                <p className="text-slate-600 leading-relaxed">
                                    <strong className="text-slate-900">Sample Data:</strong> Data populated from `ATS Logistics Services` and `ALCO USA LLP` based on recent screenshots.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-xs mt-0.5">4</div>
                                <p className="text-slate-600 leading-relaxed">
                                    <strong className="text-slate-900">Visual Polish:</strong> Uses the FleetFlow color palette (Slate, Indigo, Emerald) with custom scrollbars and smooth hover transitions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
