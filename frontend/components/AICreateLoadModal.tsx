"use client";

import { useState } from "react";
import { apiFetch, getToken, API_BASE } from "@/lib/api";
import { useForm } from "react-hook-form";
import {
    FileUp,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    Building2,
    Hash,
    DollarSign,
    MapPin,
    Calendar,
    Save
} from "lucide-react";

interface ParsedData {
    load_number?: string;
    broker_name?: string;
    rate_amount?: string;
    po_number?: string;
    pickup_address?: string;
    delivery_address?: string;
    pickup_date?: string;
    delivery_date?: string;
    load_type?: string;
    weight?: string;
    pallets?: string;
    length_ft?: string;
    raw_data?: string;
    addresses?: Array<{
        company?: string;
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        full_address?: string;
    }>;
}

interface AICreateLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (loadId: number) => void;
}

export default function AICreateLoadModal({ isOpen, onClose, onSuccess }: AICreateLoadModalProps) {
    const [step, setStep] = useState<"upload" | "parsing" | "review">("upload");
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset, setValue } = useForm<ParsedData>();

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStep("parsing");
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        const token = getToken();

        try {
            const response = await fetch(`${API_BASE}/loads/parse-rate-con`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to parse document. Please try again or create manually.");
            }

            const result = await response.json();

            // Map extracted data or handle raw text if extraction was minimal
            const data: ParsedData = result.data || {};

            // If we got raw text but no structured data, we might want to do some client-side regex or just show raw
            if (result.raw_data && !Object.keys(data).length) {
                // Simple heuristic parsing for raw text if backend structured extraction failed
                const text = result.raw_data;
                data.raw_data = text;

                const loadMatch = text.match(/Load\s*#?\s*:?\s*([A-Z0-9\-]+)/i);
                if (loadMatch) data.load_number = loadMatch[1];

                const rateMatch = text.match(/\$\s*([0-9,]+\.?\d{0,2})/);
                if (rateMatch) data.rate_amount = rateMatch[1].replace(",", "");
            }

            setParsedData(data);
            setStep("review");

            // Set form values
            if (data.load_number) setValue("load_number", data.load_number);
            if (data.broker_name) setValue("broker_name", data.broker_name);
            if (data.rate_amount) setValue("rate_amount", data.rate_amount);
            if (data.po_number) setValue("po_number", data.po_number);
            if (data.pickup_address) setValue("pickup_address", data.pickup_address);
            if (data.delivery_address) setValue("delivery_address", data.delivery_address);
            if (data.load_type) setValue("load_type", data.load_type);
            if (data.weight) setValue("weight", data.weight);
            if (data.pallets) setValue("pallets", data.pallets);
            if (data.length_ft) setValue("length_ft", data.length_ft);
            
            // Set pickup/delivery from addresses if available
            if (data.addresses && data.addresses.length >= 2) {
                const pickup = data.addresses[0];
                const delivery = data.addresses[data.addresses.length - 1];
                
                setValue("pickup_address", pickup.full_address || `${pickup.street}, ${pickup.city}, ${pickup.state} ${pickup.zip}`);
                setValue("delivery_address", delivery.full_address || `${delivery.street}, ${delivery.city}, ${delivery.state} ${delivery.zip}`);
            }

        } catch (err: any) {
            setError(err.message || "An error occurred while processing the file.");
            setStep("upload");
        } finally {
            setIsUploading(false);
        }
    };

    const onSave = async (data: ParsedData) => {
        setIsSaving(true);
        setError(null);
        try {
            const result = await apiFetch("/loads", {
                method: "POST",
                body: JSON.stringify({
                    load_number: data.load_number || `AI-${Date.now()}`,
                    broker_name: data.broker_name,
                    rate_amount: data.rate_amount ? parseFloat(data.rate_amount) : 0,
                    po_number: data.po_number,
                    pickup_address: data.pickup_address || "TBD",
                    delivery_address: data.delivery_address || "TBD",
                    status: "Available", // Default to available
                    load_type: data.load_type || "Full",
                    weight: data.weight ? parseFloat(data.weight) : null,
                    pallets: data.pallets ? parseInt(data.pallets) : null,
                    length_ft: data.length_ft ? parseFloat(data.length_ft) : null,
                    notes: `Auto-created via AI OCR.`,
                    stops: parsedData?.addresses && parsedData.addresses.length > 2 ? parsedData.addresses.slice(1, -1).map((addr, idx) => ({
                        stop_type: "intermediate",
                        stop_number: idx + 2,
                        company: addr.company,
                        address: addr.full_address || `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`,
                        city: addr.city,
                        state: addr.state,
                        zip_code: addr.zip
                    })) : []
                }),
            });

            onSuccess(result.id);
            onClose();
            resetState();
        } catch (err: any) {
            setError(err.message || "Failed to create load.");
        } finally {
            setIsSaving(false);
        }
    };

    const resetState = () => {
        setStep("upload");
        setParsedData(null);
        setError(null);
        reset();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI Auto-Create Load</h2>
                            <p className="text-blue-100 text-xs">Upload your Rate Confirmation to automate entry</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { onClose(); resetState(); }}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-background">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {step === "upload" && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 transition-colors group">
                            <div className="bg-primary/10 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                <FileUp className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1 text-center">Drop Rate Confirmation here</h3>
                            <p className="text-muted-foreground text-sm mb-8 text-center max-w-xs">
                                Supports PDF (scanned or digital), PNG, and JPEG formats
                            </p>

                            <label className="relative">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,image/*"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <span className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all inline-block">
                                    Select File
                                </span>
                            </label>

                            <p className="mt-6 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                Powered by FleetFlow AI Vision
                            </p>
                        </div>
                    )}

                    {step === "parsing" && (
                        <div className="text-center py-20 flex flex-col items-center justify-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                                <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Analyzing Document...</h3>
                            <p className="text-muted-foreground text-sm max-w-xs">
                                Extracting load details, addresses, and rates using AI OCR. This usually takes 5-10 seconds.
                            </p>
                        </div>
                    )}

                    {step === "review" && (
                        <form id="ai-load-form" onSubmit={handleSubmit(onSave)} className="space-y-6">
                            <div className="flex items-center gap-2 mb-4 text-green-600 dark:text-green-400 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Extraction Complete - Please Review Details</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Hash className="w-3 h-3" /> LOAD NUMBER
                                    </label>
                                    <input
                                        {...register("load_number")}
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="w-3 h-3" /> BROKER / CUSTOMER
                                    </label>
                                    <input
                                        {...register("broker_name")}
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <DollarSign className="w-3 h-3" /> RATE AMOUNT
                                    </label>
                                    <input
                                        {...register("rate_amount")}
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Hash className="w-3 h-3" /> PO / REFERENCE
                                    </label>
                                    <input
                                        {...register("po_number")}
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LOAD TYPE</label>
                                    <select
                                        {...register("load_type")}
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    >
                                        <option value="Full">Full</option>
                                        <option value="Partial">Partial</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WEIGHT</label>
                                    <input
                                        {...register("weight")}
                                        type="number"
                                        placeholder="Lbs"
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">PALLETS</label>
                                    <input
                                        {...register("pallets")}
                                        type="number"
                                        placeholder="Qty"
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LENGTH (FT)</label>
                                    <input
                                        {...register("length_ft")}
                                        type="number"
                                        placeholder="Feet"
                                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-blue-500" /> PICKUP ADDRESS
                                </label>
                                <input
                                    {...register("pickup_address")}
                                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-green-500" /> DELIVERY ADDRESS
                                </label>
                                <input
                                    {...register("delivery_address")}
                                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {parsedData?.addresses && parsedData.addresses.length > 2 && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Found {parsedData.addresses.length - 2} Intermediate Stops
                                    </label>
                                    <div className="space-y-2">
                                        {parsedData.addresses.slice(1, -1).map((stop, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-xl">
                                                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{stop.company || "Unknown Stop"}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{stop.full_address || `${stop.city}, ${stop.state}`}</p>
                                                </div>
                                                <div className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">STOP</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedData?.raw_data && (
                                <div className="mt-6 p-4 bg-muted/20 border border-border rounded-xl">
                                    <details>
                                        <summary className="text-xs font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors uppercase tracking-widest">
                                            View Raw Machine Text
                                        </summary>
                                        <pre className="mt-3 text-[10px] text-muted-foreground bg-black/5 dark:bg-black/20 p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap font-mono">
                                            {parsedData.raw_data}
                                        </pre>
                                    </details>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/20 flex gap-3">
                    <button
                        onClick={() => { onClose(); resetState(); }}
                        className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    {step === "review" && (
                        <button
                            form="ai-load-form"
                            type="submit"
                            className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Confirm & Create Load
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
