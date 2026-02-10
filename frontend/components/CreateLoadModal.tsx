"use client";

import { useState } from "react";
import EnhancedModal from "./ui/enhanced-modal";
import { Button } from "./ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch, getToken } from "../lib/api";

interface CreateLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    drivers: Array<{ id: number; name: string }>;
}

type ViewMode = "choice" | "manual" | "ocr" | "review";

export default function CreateLoadModal({
    isOpen,
    onClose,
    onSuccess,
    drivers,
}: CreateLoadModalProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("choice");
    const [uploading, setUploading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);

    const [form, setForm] = useState({
        loadNumber: "",
        status: "Created",
        pickup: "",
        delivery: "",
        notes: "",
        driverId: "",
        brokerName: "",
        poNumber: "",
        rateAmount: "",
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setExtracting(true);
        setError(null);

        try {
            const token = getToken();
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("http://localhost:8000/loads/parse-rate-con", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to parse rate confirmation");
            }

            const data = await response.json();
            console.log("Extracted data from API:", data);
            setExtractedData(data);

            // Pre-fill form with extracted data - handle both data.data and direct data
            const extracted = data.data || data;
            console.log("Extracted fields:", extracted);

            setForm({
                loadNumber: extracted.load_number || "",
                status: "Created",
                pickup: extracted.addresses?.[0]?.full_address || "",
                delivery: extracted.addresses?.[1]?.full_address || "",
                notes: `Broker: ${extracted.broker_name || "N/A"} | MC: ${extracted.mc_number || "N/A"} | Rate: $${extracted.rate_amount || "N/A"}`,
                driverId: "",
                brokerName: extracted.broker_name || "",
                poNumber: extracted.po_number || "",
                rateAmount: extracted.rate_amount || "",
            });

            console.log("Form populated with:", {
                loadNumber: extracted.load_number,
                pickup: extracted.addresses?.[0]?.full_address,
                delivery: extracted.addresses?.[1]?.full_address,
                brokerName: extracted.broker_name,
            });

            setViewMode("review");
        } catch (err: any) {
            setError(err.message || "Failed to extract data from file");
        } finally {
            setUploading(false);
            setExtracting(false);
        }
    };

    const handleCreateLoad = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);

        try {
            const token = getToken();
            await apiFetch("/loads", {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    load_number: form.loadNumber,
                    status: form.status,
                    pickup_address: form.pickup,
                    delivery_address: form.delivery,
                    notes: form.notes,
                    driver_id: form.driverId ? Number(form.driverId) : null,
                    broker_name: form.brokerName,
                    po_number: form.poNumber,
                }),
            });

            // Reset and close
            setForm({
                loadNumber: "",
                status: "Created",
                pickup: "",
                delivery: "",
                notes: "",
                driverId: "",
                brokerName: "",
                poNumber: "",
                rateAmount: "",
            });
            setViewMode("choice");
            setExtractedData(null);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create load");
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setViewMode("choice");
        setExtractedData(null);
        setError(null);
        onClose();
    };

    return (
        <EnhancedModal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                viewMode === "choice"
                    ? "Create New Load"
                    : viewMode === "manual"
                        ? "Manual Entry"
                        : viewMode === "ocr"
                            ? "Upload Rate Confirmation"
                            : "Review & Confirm"
            }
            size="lg"
        >
            {/* Choice View */}
            {viewMode === "choice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => setViewMode("manual")}
                        className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-primary transition-all p-8 text-center hover:shadow-lg"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Entry</h3>
                            <p className="text-sm text-gray-600">
                                Enter load details manually using the form
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setViewMode("ocr")}
                        className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-primary transition-all p-8 text-center hover:shadow-lg"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Extraction</h3>
                            <p className="text-sm text-gray-600">
                                Upload rate confirmation for automatic data extraction
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* OCR Upload View */}
            {viewMode === "ocr" && (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary transition-colors">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Upload Rate Confirmation
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Supports PDF and image files (PNG, JPG)
                        </p>
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="rate-con-upload"
                            disabled={uploading}
                        />
                        <label htmlFor="rate-con-upload">
                            <Button
                                type="button"
                                className="cursor-pointer"
                                disabled={uploading}
                                onClick={() => document.getElementById("rate-con-upload")?.click()}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Extracting...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Choose File
                                    </>
                                )}
                            </Button>
                        </label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <Button variant="outline" onClick={() => setViewMode("choice")} className="w-full">
                        Back to Options
                    </Button>
                </div>
            )}

            {/* Manual Entry & Review Form */}
            {(viewMode === "manual" || viewMode === "review") && (
                <form onSubmit={handleCreateLoad} className="space-y-6">
                    {viewMode === "review" && extractedData && (
                        <>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-900">
                                        Data Extracted Successfully
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Confidence: {Math.round((extractedData.overall_confidence || 0) * 100)}%
                                        {extractedData.overall_confidence < 0.7 && " - Please review carefully"}
                                    </p>
                                </div>
                            </div>

                            {/* Debug Panel - Show extracted data */}
                            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                                    View Extracted Data (Debug)
                                </summary>
                                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                                    {JSON.stringify(extractedData, null, 2)}
                                </pre>
                            </details>
                        </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Load Number *
                            </label>
                            <input
                                type="text"
                                value={form.loadNumber}
                                onChange={(e) => setForm({ ...form, loadNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Broker Name
                            </label>
                            <input
                                type="text"
                                value={form.brokerName}
                                onChange={(e) => setForm({ ...form, brokerName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pickup Address *
                            </label>
                            <input
                                type="text"
                                value={form.pickup}
                                onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Address *
                            </label>
                            <input
                                type="text"
                                value={form.delivery}
                                onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                PO Number
                            </label>
                            <input
                                type="text"
                                value={form.poNumber}
                                onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign Driver
                            </label>
                            <select
                                value={form.driverId}
                                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">Unassigned</option>
                                {drivers.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewMode("choice")}
                            className="flex-1"
                        >
                            Back
                        </Button>
                        <Button type="submit" disabled={creating} className="flex-1">
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Load"
                            )}
                        </Button>
                    </div>
                </form>
            )}
        </EnhancedModal>
    );
}
