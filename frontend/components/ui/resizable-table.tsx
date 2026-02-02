"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

export type Employee = {
    id: string;
    broker: string;
    poNumber: string;
    rate: string;
    commodity: string;
    pickup: string;
    delivery: string;
    status: string;
};

const SAMPLE_DATA: Employee[] = [
    {
        id: "1",
        broker: "ATS Logistics Services",
        poNumber: "1210905",
        rate: "$4,000.00",
        commodity: "1 PIPE 100 LBS",
        pickup: "Houston, TX",
        delivery: "Shafter, CA",
        status: "Pending Approval",
    },
    {
        id: "2",
        broker: "ALCO USA LLP",
        poNumber: "70911",
        rate: "$1,250.00",
        commodity: "General Freight",
        pickup: "Magnolia, TX",
        delivery: "Houma, LA",
        status: "Active",
    }
];

interface ResizableTableProps {
    title?: string;
    onEmployeeSelect?: (id: string) => void;
    onColumnResize?: (columnKey: string, newWidth: number) => void;
}

const DEFAULT_WIDTHS: Record<string, number> = {
    broker: 200,
    poNumber: 120,
    rate: 100,
    commodity: 200,
    pickup: 180,
    delivery: 180,
};

export function ResizableTable({ title, onEmployeeSelect, onColumnResize }: ResizableTableProps) {
    const [widths, setWidths] = useState(DEFAULT_WIDTHS);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const resizingColumn = useRef<string | null>(null);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(0);

    const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
        e.preventDefault();
        resizingColumn.current = columnKey;
        startX.current = e.pageX;
        startWidth.current = widths[columnKey];
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "col-resize";
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingColumn.current) return;
        const diff = e.pageX - startX.current;
        const newWidth = Math.max(80, startWidth.current + diff);

        setWidths((prev) => ({
            ...prev,
            [resizingColumn.current!]: newWidth,
        }));
    }, []);

    const handleMouseUp = useCallback(() => {
        if (resizingColumn.current && onColumnResize) {
            onColumnResize(resizingColumn.current, widths[resizingColumn.current]);
        }
        resizingColumn.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
    }, [widths, onColumnResize, handleMouseMove]);

    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleRowClick = (id: string) => {
        setSelectedId(id);
        if (onEmployeeSelect) onEmployeeSelect(id);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            {title && (
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <div className="flex gap-2">
                        <span className="text-sm text-slate-500 font-medium">{SAMPLE_DATA.length} Total</span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                <table className="w-full border-collapse table-fixed select-none" ref={tableRef}>
                    <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                        <tr>
                            {Object.entries(widths).map(([key, width]) => (
                                <th
                                    key={key}
                                    style={{ width }}
                                    className="relative h-12 px-4 text-left font-semibold text-slate-600 text-sm uppercase tracking-wider group border-r border-slate-100 last:border-r-0"
                                >
                                    <div className="flex items-center gap-2">
                                        {key === 'poNumber' ? 'PO #' : key.charAt(0).toUpperCase() + key.slice(1)}
                                    </div>
                                    <div
                                        onMouseDown={(e) => handleMouseDown(key, e)}
                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-600 transition-colors z-20 group-hover:bg-slate-200/50"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {SAMPLE_DATA.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => handleRowClick(row.id)}
                                className={cn(
                                    "group transition-all duration-200 cursor-pointer text-slate-700",
                                    selectedId === row.id ? "bg-indigo-50" : "hover:bg-slate-50/80"
                                )}
                            >
                                <td className="px-4 py-4 truncate border-r border-slate-50 last:border-r-0 font-medium">
                                    {row.broker}
                                </td>
                                <td className="px-4 py-4 truncate border-r border-slate-50 last:border-r-0 text-slate-500">
                                    {row.poNumber}
                                </td>
                                <td className="px-4 py-4 truncate border-r border-slate-50 last:border-r-0 font-semibold text-emerald-600">
                                    {row.rate}
                                </td>
                                <td className="px-4 py-4 truncate border-r border-slate-50 last:border-r-0 italic text-slate-600">
                                    {row.commodity}
                                </td>
                                <td className="px-4 py-4 truncate border-r border-slate-50 last:border-r-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        {row.pickup}
                                    </div>
                                </td>
                                <td className="px-4 py-4 truncate border-r border-slate-50 last:border-r-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                        {row.delivery}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
