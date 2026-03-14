"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
    Settings,
    Map as MapIcon,
    ShieldCheck,
    Radio,
    Sparkles,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Save,
    RefreshCw,
    Search
} from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("integrations");
    const [mapboxStatus, setMapboxStatus] = useState<any>(null);
    const [fmcsaTestResult, setFmcsaTestResult] = useState<any>(null);
    const [motiveStatus, setMotiveStatus] = useState<any>(null);
    const [isTestingMapbox, setIsTestingMapbox] = useState(false);
    const [isTestingFMCSA, setIsTestingFMCSA] = useState(false);
    const [isTestingMotive, setIsTestingMotive] = useState(false);
    const [dotNumber, setDotNumber] = useState("1234567");

    useEffect(() => {
        checkIntergrationStatus();
    }, []);

    const checkIntergrationStatus = async () => {
        try {
            const mapbox = await apiFetch("/mapbox/health");
            setMapboxStatus(mapbox);
        } catch (e) {
            setMapboxStatus({ status: "error", error: "Could not connect to API" });
        }

        // Motive status check (placeholder as we don't have a dedicated health endpoint yet)
        try {
            const motive = await apiFetch("/motive/drivers");
            setMotiveStatus({ status: "connected", count: motive.length });
        } catch (e) {
            setMotiveStatus({ status: "disconnected" });
        }
    };

    const testMapbox = async () => {
        setIsTestingMapbox(true);
        try {
            const result = await apiFetch("/mapbox/autocomplete", {
                method: "POST",
                body: JSON.stringify({ query: "123 Main St" })
            });
            setMapboxStatus({ ...mapboxStatus, test: "success", suggestions: result.suggestions?.length || 0 });
        } catch (e) {
            setMapboxStatus({ ...mapboxStatus, test: "failed" });
        } finally {
            setIsTestingMapbox(false);
        }
    };

    const testFMCSA = async () => {
        if (!dotNumber) return;
        setIsTestingFMCSA(true);
        setFmcsaTestResult(null);
        try {
            const result = await apiFetch(`/fmcsa/lookup/dot/${dotNumber}`);
            setFmcsaTestResult({ success: true, data: result });
        } catch (e: any) {
            setFmcsaTestResult({ success: false, error: e.message || "Lookup failed" });
        } finally {
            setIsTestingFMCSA(false);
        }
    };

    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-600" />
                        System Settings
                    </h1>
                    <p className="text-slate-500 mt-1">Configure integrations, AI models, and carrier preferences</p>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl w-fit">
                {["Integrations", "AI Models", "Carrier Profile", "Security"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.toLowerCase()
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "integrations" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mapbox Integration */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                    <MapIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Mapbox Routing</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">Truck Map API</p>
                                </div>
                            </div>
                            <StatusBadge status={mapboxStatus?.status === "configured" ? "online" : "offline"} />
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-500">API CONFIGURATION</span>
                                    {mapboxStatus?.status !== "configured" && (
                                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">KEY MISSING</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                                        MAPBOX_API_KEY=pk.eyJ...
                                    </code>
                                    <a href="https://mapbox.com" target="_blank" className="text-blue-600 hover:text-blue-700 transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={testMapbox}
                                    disabled={isTestingMapbox || mapboxStatus?.status !== "configured"}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isTestingMapbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Test Connection
                                </button>
                            </div>

                            {mapboxStatus?.test === "success" && (
                                <div className="text-xs text-green-600 font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Test passed: Successfully fetched {mapboxStatus.suggestions} suggestions
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FMCSA Integration */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">FMCSA Lookup</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">Broker Verification</p>
                                </div>
                            </div>
                            <StatusBadge status="online" />
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-500 block mb-3 uppercase tracking-wider">Broker Live Lookup Test</span>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={dotNumber}
                                            onChange={(e) => setDotNumber(e.target.value)}
                                            placeholder="DOT Number"
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={testFMCSA}
                                        disabled={isTestingFMCSA || !dotNumber}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isTestingFMCSA ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
                                    </button>
                                </div>
                            </div>

                            {fmcsaTestResult?.success && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Broker Identified
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-900 uppercase">{fmcsaTestResult.data.legal_name}</p>
                                        <p className="text-[10px] text-slate-500">DOT: {fmcsaTestResult.data.dot_number} | Status: <span className="text-emerald-600 font-bold uppercase">{fmcsaTestResult.data.status}</span></p>
                                    </div>
                                </div>
                            )}

                            {fmcsaTestResult?.success === false && (
                                <div className="text-xs text-red-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                                    <XCircle className="w-4 h-4" />
                                    {fmcsaTestResult.error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Motive ELD Integration */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                    <Radio className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Motive ELD</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">HOS & GPS Live Feed</p>
                                </div>
                            </div>
                            <StatusBadge status={motiveStatus?.status === "connected" ? "online" : "offline"} />
                        </div>

                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-orange-900">
                                    {motiveStatus?.status === "connected" ? `${motiveStatus.count} Active Units` : "Not Connected"}
                                </p>
                                <p className="text-xs text-orange-700 mt-0.5">Last sync: Just now</p>
                            </div>
                            <button className="px-4 py-2 bg-white border border-orange-200 text-orange-700 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors">
                                Configure API
                            </button>
                        </div>
                    </div>

                    {/* AI OCR Engine */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">AI OCR Engine</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">Rate Con Parsing</p>
                                </div>
                            </div>
                            <StatusBadge status="online" />
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-purple-900">Vision System Active</p>
                                <span className="text-[10px] bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full font-bold">GPT-4o + Tesseract</span>
                            </div>
                            <p className="text-xs text-purple-700">Processes PDFs, JPEG, PNG for high-accuracy load extraction.</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function StatusBadge({ status }: { status: "online" | "offline" }) {
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === "online"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {status}
        </div>
    );
}
