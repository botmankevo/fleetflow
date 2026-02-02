"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "../../../../lib/api";
import { ResizableTable } from "../../../../components/ui/resizable-table";
import { ContributorsTable } from "../../../../components/ui/ruixen-contributors-table";
import { WidgetContainer } from "../../../../components/dashboard/widget-container";
import { cn } from "../../../../lib/utils";

type Load = {
  id: number;
  load_number?: string | null;
  pickup_address: string;
  delivery_address: string;
  driver_id?: number | null;
  status: string;
  rate: string;
  broker: string;
};

const SUMMARY_ITEMS = [
  { label: "Active Revenue", value: "$411,897.90", color: "bg-emerald-500" },
  { label: "Pending", value: "$2,272.30", color: "bg-amber-500" },
  { label: "Completed", value: "$10,082.50", color: "bg-indigo-500" },
  { label: "Total", value: "$425,602.70", color: "bg-slate-900", isTotal: true },
];

export default function AdminLoads() {
  const [, setLoads] = useState<Load[]>([]);
  const [ready, setReady] = useState(false);
  const [showNewLoadDropdown, setShowNewLoadDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const res = await apiFetch("/loads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Enrich mock data if needed for the demo feel
        const enriched = res.map((l: Load) => ({
          ...l,
          rate: l.rate || "$1,250.00",
          status: l.status || "In Transit",
          broker: l.broker || "TQL"
        }));
        setLoads(enriched);
        setReady(true);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNewLoadDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = () => {
    setIsUploading(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsUploading(false);
      setShowReviewModal(true);
      setShowNewLoadDropdown(false);
    }, 2000);
  };

  if (!ready) return <div className="p-8 text-slate-400 font-medium">Loading Loads...</div>;

  return (
    <main className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Loads</h1>
          <p className="text-slate-500 mt-1">Manage and track your active transport loads</p>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNewLoadDropdown(!showNewLoadDropdown)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 group"
          >
            <span className="text-xl group-hover:rotate-90 transition-transform">+</span>
            New Load
          </button>

          {showNewLoadDropdown && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => router.push('/admin/loads/new')}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">📝</div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">Manual Load Entry</div>
                  <div className="text-xs text-slate-400">Enter load details manually</div>
                </div>
              </button>
              <button
                onClick={handleFileUpload}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">✨</div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">Auto-Create from PDF</div>
                  <div className="text-xs text-slate-400">AI extraction from Rate Confirmation</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {SUMMARY_ITEMS.map((item) => (
          <div key={item.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
            <div className={cn("absolute top-0 left-0 w-1 h-full transition-all group-hover:w-2", item.color)} />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
            <span className={cn("text-2xl font-bold text-slate-900 tracking-tight", item.isTotal && "text-indigo-600")}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <WidgetContainer
        title="Active Transport Loads"
        description="Real-time monitoring of fleet deployment and shipment status"
        className="h-[650px]"
      >
        <ResizableTable
          onEmployeeSelect={(id: string) => console.log("Selected Load:", id)}
        />
      </WidgetContainer>

      {/* Contributors Widget (DashSpace Style) */}
      <WidgetContainer
        title="Team Allocation"
        description="Contributors and developers assigned to logistics modules"
      >
        <ContributorsTable />
      </WidgetContainer>

      {/* AI Processing Modal Placeholder */}
      {(isUploading || showReviewModal) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          {isUploading ? (
            <div className="bg-white p-12 rounded-3xl shadow-2xl text-center space-y-4 animate-in zoom-in duration-300 max-w-sm">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900">AI Processing...</h2>
              <p className="text-slate-500">Extracting load data from your Rate Confirmation PDF. Almost there!</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Review AI-Extracted Load Details</h2>
                <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">{"\u00D7"}</button>
              </div>
              <div className="flex-1 overflow-hidden flex">
                {/* PDF Placeholder */}
                <div className="w-1/2 bg-slate-100 border-r border-slate-200 p-8 flex flex-col items-center justify-center">
                  <div className="w-full max-w-md h-full bg-white rounded-xl shadow-lg border border-slate-300 p-12 space-y-8">
                    <div className="h-6 w-3/4 bg-slate-100 rounded" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    <div className="space-y-4 pt-12">
                      <div className="h-4 w-full bg-slate-50 rounded" />
                      <div className="h-4 w-full bg-slate-50 rounded" />
                      <div className="h-4 w-2/3 bg-slate-50 rounded" />
                    </div>
                    <div className="pt-24 text-center text-slate-300 italic font-medium">Rate Confirmation Preview</div>
                  </div>
                </div>
                {/* Fields Review */}
                <div className="w-1/2 overflow-y-auto p-8 bg-white custom-scrollbar space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Broker</label>
                      <input value="ATS Logistics Services" className="w-full input border-indigo-200 bg-indigo-50/20" readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">PO #</label>
                      <input value="1210905" className="w-full input border-indigo-200 bg-indigo-50/20" readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Rate</label>
                      <input value="$4,000.00" className="w-full input border-indigo-200 bg-indigo-50/20 font-bold text-emerald-600" readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400">Carrier Ref</label>
                      <input value="FF-9021" className="w-full input border-indigo-200 bg-indigo-50/20" readOnly />
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                    <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Stops (2)</h4>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 text-sm">Pickup</div>
                          <div className="text-sm text-slate-500">Houston, TX • Jan 12, 2026 03:00 PM</div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 text-sm">Delivery</div>
                          <div className="text-sm text-slate-500">Shafter, CA • Jan 14, 2026 07:00 AM</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">AI Transcription Notes</label>
                    <div className="p-4 bg-amber-50 rounded-xl text-amber-800 text-sm italic border border-amber-100">
                      {"Extracted 1 PIPE (100 LBS). Commodity matched with existing patterns. Driver assignment suggested based on location."}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30">
                <button onClick={() => setShowReviewModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-700 transition-colors">Discard</button>
                <button onClick={() => setShowReviewModal(false)} className="px-8 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all">{"Approve & Save Load"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
    </main>
  );
}
