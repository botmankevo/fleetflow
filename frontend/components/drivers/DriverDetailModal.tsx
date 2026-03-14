"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/lib/api";
import { X, DollarSign, Users, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type PayProfile = {
    id: number;
    pay_type: "per_mile" | "percent" | "flat" | "hourly";
    rate: number;
    driver_kind: "company_driver" | "owner_operator";
    active: boolean;
};

type AdditionalPayee = {
    id: number;
    payee_id: number;
    payee_name?: string;
    pay_rate_percent: number;
    active: boolean;
};

type RecurringItem = {
    id: number;
    payee_id: number;
    payee_name?: string;
    item_type: "deduction" | "addition" | "bonus" | "loan" | "escrow";
    amount: number;
    schedule: "weekly" | "biweekly" | "monthly" | "per_settlement";
    description?: string;
    active: boolean;
};

type Payee = { id: number; name: string; payee_type: string };

type DriverDetail = {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    pay_profile?: PayProfile;
    additional_payees?: AdditionalPayee[];
    recurring_items?: RecurringItem[];
};

type Props = {
    driverId: number;
    driverName: string;
    onClose: () => void;
};

export default function DriverDetailModal({ driverId, driverName, onClose }: Props) {
    const [driver, setDriver] = useState<DriverDetail | null>(null);
    const [payees, setPayees] = useState<Payee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"pay_profile" | "equipment_owners" | "deductions">("pay_profile");

    // Pay Profile form
    const [payType, setPayType] = useState<"per_mile" | "percent" | "flat" | "hourly">("per_mile");
    const [rate, setRate] = useState("");
    const [driverKind, setDriverKind] = useState<"company_driver" | "owner_operator">("company_driver");
    const [savingProfile, setSavingProfile] = useState(false);

    // Additional Payee form
    const [newPayeeId, setNewPayeeId] = useState("");
    const [newPayeeRate, setNewPayeeRate] = useState("");

    // Recurring Item form
    const [newItemType, setNewItemType] = useState<"deduction" | "addition" | "bonus" | "loan" | "escrow">("deduction");
    const [newItemAmount, setNewItemAmount] = useState("");
    const [newItemPayeeId, setNewItemPayeeId] = useState("");
    const [newItemSchedule, setNewItemSchedule] = useState<"weekly" | "biweekly" | "monthly" | "per_settlement">("per_settlement");
    const [newItemDesc, setNewItemDesc] = useState("");

    const token = getToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    useEffect(() => {
        loadDriver();
        loadPayees();
    }, [driverId]);

    async function loadDriver() {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch(`/payroll/drivers/${driverId}`, { headers: { Authorization: `Bearer ${token}` } });
            setDriver(res);
            if (res.pay_profile) {
                setPayType(res.pay_profile.pay_type as any);
                setRate(res.pay_profile.rate.toString());
                setDriverKind(res.pay_profile.driver_kind as any);
            }
        } catch (err: any) {
            setError(err?.message || "Failed to load driver details");
        } finally {
            setLoading(false);
        }
    }

    async function loadPayees() {
        try {
            const res = await apiFetch("/payroll/payees", { headers: { Authorization: `Bearer ${token}` } });
            setPayees(res);
        } catch { }
    }

    async function savePayProfile() {
        setSavingProfile(true);
        setError(null);
        setSuccess(null);
        try {
            await apiFetch(`/payroll/drivers/${driverId}/pay-profile`, {
                method: "POST",
                headers,
                body: JSON.stringify({ pay_type: payType, rate: parseFloat(rate), driver_kind: driverKind }),
            });
            setSuccess("Pay profile saved successfully!");
            setTimeout(() => setSuccess(null), 3000);
            loadDriver();
        } catch (err: any) {
            setError(err?.message || "Failed to save pay profile");
        } finally {
            setSavingProfile(false);
        }
    }

    async function addAdditionalPayee() {
        if (!newPayeeId || !newPayeeRate) return;
        setError(null);
        try {
            await apiFetch(`/payroll/drivers/${driverId}/additional-payees`, {
                method: "POST",
                headers,
                body: JSON.stringify({ payee_id: parseInt(newPayeeId), pay_rate_percent: parseFloat(newPayeeRate) }),
            });
            setSuccess("Equipment owner added!");
            setTimeout(() => setSuccess(null), 3000);
            setNewPayeeId("");
            setNewPayeeRate("");
            loadDriver();
        } catch (err: any) {
            setError(err?.message || "Failed to add payee");
        }
    }

    async function removeAdditionalPayee(additionalPayeeId: number) {
        setError(null);
        try {
            await apiFetch(`/payroll/drivers/${driverId}/additional-payees/${additionalPayeeId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess("Equipment owner removed");
            setTimeout(() => setSuccess(null), 3000);
            loadDriver();
        } catch (err: any) {
            setError(err?.message || "Failed to remove payee");
        }
    }

    async function addRecurringItem() {
        if (!newItemAmount || !newItemPayeeId) return;
        setError(null);
        try {
            await apiFetch(`/payroll/drivers/${driverId}/recurring-items`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    payee_id: parseInt(newItemPayeeId),
                    item_type: newItemType,
                    amount: parseFloat(newItemAmount),
                    schedule: newItemSchedule,
                    description: newItemDesc,
                }),
            });
            setSuccess("Recurring item added!");
            setTimeout(() => setSuccess(null), 3000);
            setNewItemAmount("");
            setNewItemDesc("");
            setNewItemPayeeId("");
            loadDriver();
        } catch (err: any) {
            setError(err?.message || "Failed to add recurring item");
        }
    }

    async function removeRecurringItem(itemId: number) {
        setError(null);
        try {
            await apiFetch(`/payroll/drivers/${driverId}/recurring-items/${itemId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess("Recurring item removed");
            setTimeout(() => setSuccess(null), 3000);
            loadDriver();
        } catch (err: any) {
            setError(err?.message || "Failed to remove item");
        }
    }

    const payTypeLabels = { per_mile: "Per Mile", percent: "Percentage (%)", flat: "Flat Rate ($)", hourly: "Hourly Rate ($)" };
    const driverKindLabels = { company_driver: "Company Driver", owner_operator: "Owner Operator" };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-blue-600/90 to-blue-700/90">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                            {driverName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{driverName}</h2>
                            <p className="text-blue-100 text-sm mt-0.5">Payment Strategy & Deductions</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Messages Overlay */}
                <div className="relative">
                    {error && (
                        <div className="absolute top-0 left-0 right-0 z-10 mx-6 mt-4 p-3 bg-destructive/15 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center justify-between animate-in slide-in-from-top-4">
                            <span>{error}</span>
                            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                        </div>
                    )}
                    {success && (
                        <div className="absolute top-0 left-0 right-0 z-10 mx-6 mt-4 p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg animate-in slide-in-from-top-4">
                            {success}
                        </div>
                    )}
                </div>

                {/* Tab Nav */}
                <div className="flex border-b border-border px-6 bg-muted/30">
                    {(["pay_profile", "equipment_owners", "deductions"] as const).map((tab) => {
                        const labels = { pay_profile: "Pay Strategy", equipment_owners: "Equipment Owners", deductions: "Additions/Deductions" };
                        const icons = { pay_profile: <DollarSign className="h-4 w-4" />, equipment_owners: <Users className="h-4 w-4" />, deductions: <RefreshCw className="h-4 w-4" /> };
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === tab
                                        ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white/50"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/30"
                                    }`}
                            >
                                {icons[tab]}
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="animate-spin h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full mb-4" />
                            <p className="text-muted-foreground font-medium">Synchronizing data...</p>
                        </div>
                    ) : (
                        <>
                            {/* ─── PAY PROFILE TAB ─── */}
                            {activeTab === "pay_profile" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-1.5">Employment Type</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(Object.keys(driverKindLabels) as Array<keyof typeof driverKindLabels>).map((kind) => (
                                                        <button
                                                            key={kind}
                                                            onClick={() => setDriverKind(kind)}
                                                            className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${driverKind === kind
                                                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                                                    : "border-border bg-background hover:border-gray-300"
                                                                }`}
                                                        >
                                                            {driverKindLabels[kind]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-1.5">Calculation Method</label>
                                                <select
                                                    value={payType}
                                                    onChange={(e) => setPayType(e.target.value as any)}
                                                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                                                >
                                                    <option value="per_mile">Per Mile Calculation</option>
                                                    <option value="percent">Percentage of Gross Revenue</option>
                                                    <option value="flat">Flat Rate per Load</option>
                                                    <option value="hourly">Hourly Rate</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-6 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200 dark:shadow-none">
                                                <label className="block text-blue-100 text-sm font-medium mb-2">Configure Rate</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-3xl font-bold">
                                                        {["percent"].includes(payType) ? "" : "$"}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={rate}
                                                        onChange={(e) => setRate(e.target.value)}
                                                        className="w-full bg-transparent border-b-2 border-white/30 focus:border-white outline-none text-4xl font-black placeholder:text-white/40"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="text-2xl font-bold">
                                                        {payType === "percent" ? "%" : ""}
                                                    </span>
                                                </div>
                                                <p className="mt-4 text-sm text-blue-100/80">
                                                    {payType === "per_mile" && "Total pay = Miles × Rate"}
                                                    {payType === "percent" && "Total pay = Gross × Rate%"}
                                                    {payType === "flat" && "Fixed pay per load"}
                                                    {payType === "hourly" && "Standard hourly rate"}
                                                </p>
                                            </div>

                                            <button
                                                onClick={savePayProfile}
                                                disabled={!rate || savingProfile}
                                                className="w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg"
                                            >
                                                {savingProfile ? "Processing..." : "Commit Pay Profile"}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {driver?.pay_profile && (
                                        <div className="p-4 bg-muted/40 rounded-xl border border-dashed border-border flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Currently Active Strategy</p>
                                                    <p className="text-xs text-muted-foreground">System is using this profile for all auto-calculations.</p>
                                                </div>
                                            </div>
                                            <StatusBadge status="active" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── EQUIPMENT OWNERS TAB ─── */}
                            {activeTab === "equipment_owners" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-700">
                                        <Users className="h-5 w-5 shrink-0" />
                                        <p className="text-sm leading-relaxed">
                                            <strong>Equipment Owner Splitting:</strong> When configured, the system will automatically deduct this percentage from the driver's gross pay and assign it to the selected payee.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center justify-between">
                                            Configured Owners
                                            <span className="text-xs font-normal text-muted-foreground">{driver?.additional_payees?.length || 0} Registered</span>
                                        </h3>
                                        {driver?.additional_payees && driver.additional_payees.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {driver.additional_payees.map((ap) => (
                                                    <div key={ap.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-blue-500/40 transition-all shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                                {(payees.find(p => p.id === ap.payee_id)?.name || "P")[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground text-sm">
                                                                    {payees.find(p => p.id === ap.payee_id)?.name || `Payee #${ap.payee_id}`}
                                                                </p>
                                                                <p className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                                    {ap.pay_rate_percent}% REVENUE SPLIT
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeAdditionalPayee(ap.id)}
                                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                                <Users className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400 font-medium">No specialized splits defined</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl">
                                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Define New Split</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Select Payee Entity</label>
                                                <select
                                                    value={newPayeeId}
                                                    onChange={(e) => setNewPayeeId(e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                                                >
                                                    <option value="">Select entity...</option>
                                                    {payees.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.payee_type})</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Revenue Split Percentage</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        max="100"
                                                        value={newPayeeRate}
                                                        onChange={(e) => setNewPayeeRate(e.target.value)}
                                                        className="w-full pl-4 pr-10 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-black focus:ring-2 focus:ring-blue-500 transition-all"
                                                        placeholder="0.0"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={addAdditionalPayee}
                                            disabled={!newPayeeId || !newPayeeRate}
                                            className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
                                        >
                                            Register Split Rule
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ─── DEDUCTIONS / ADDITIONS TAB ─── */}
                            {activeTab === "deductions" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center justify-between">
                                            Automated Recurring Line Items
                                            <span className="text-xs font-normal text-muted-foreground">Processed per Settlement cycle</span>
                                        </h3>
                                        {driver?.recurring_items && driver.recurring_items.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                {driver.recurring_items.filter(i => i.active).map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:shadow-md transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${["deduction", "loan"].includes(item.item_type)
                                                                    ? "bg-rose-500/10 text-rose-600"
                                                                    : "bg-emerald-500/10 text-emerald-600"
                                                                }`}>
                                                                {["deduction", "loan"].includes(item.item_type) ? "-" : "+"}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-foreground text-sm">{item.description || item.item_type.toUpperCase()}</p>
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${["deduction", "loan"].includes(item.item_type)
                                                                            ? "bg-rose-50 text-rose-600"
                                                                            : "bg-emerald-50 text-emerald-600"
                                                                        }`}>
                                                                        {item.item_type}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-lg font-black text-foreground">${Math.abs(item.amount).toFixed(2)}</span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase bg-gray-100 px-2 py-0.5 rounded-full">{item.schedule}</span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{payees.find(p => p.id === item.payee_id)?.name}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeRecurringItem(item.id)}
                                                            className="p-2 text-gray-300 hover:text-destructive hover:bg-destructive/5 rounded-full transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                                <RefreshCw className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400 font-medium">No automated items scheduled</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100">
                                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Configure New Line Item</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Entry Category</label>
                                                <select
                                                    value={newItemType}
                                                    onChange={(e) => setNewItemType(e.target.value as any)}
                                                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                                                >
                                                    <option value="deduction">Standard Deduction</option>
                                                    <option value="addition">Bonus / Addition</option>
                                                    <option value="escrow">Escrow Contribution</option>
                                                    <option value="loan">Loan Installment</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Cycle Amount ($)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newItemAmount}
                                                    onChange={(e) => setNewItemAmount(e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-black focus:ring-2 focus:ring-blue-500 transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Frequency Schedule</label>
                                                <select
                                                    value={newItemSchedule}
                                                    onChange={(e) => setNewItemSchedule(e.target.value as any)}
                                                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                                                >
                                                    <option value="per_settlement">Every Settlement</option>
                                                    <option value="weekly">Every Week</option>
                                                    <option value="biweekly">Every 2nd Week</option>
                                                    <option value="monthly">Every Month</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Payee Mapping</label>
                                                <select
                                                    value={newItemPayeeId}
                                                    onChange={(e) => setNewItemPayeeId(e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                                                >
                                                    <option value="">Select recipient...</option>
                                                    {payees.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Internal Description</label>
                                                <input
                                                    type="text"
                                                    value={newItemDesc}
                                                    onChange={(e) => setNewItemDesc(e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                                                    placeholder="e.g. Health Insurance, Truck Lease Pymt #12..."
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={addRecurringItem}
                                            disabled={!newItemAmount || !newItemPayeeId}
                                            className="mt-6 w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
                                        >
                                            Activate Recurring Item
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-white border border-border rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        active: "bg-emerald-50 text-emerald-600 border-emerald-100",
        inactive: "bg-gray-50 text-gray-500 border-gray-100",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status as keyof typeof styles] || styles.inactive}`}>
            {status}
        </span>
    );
};

const Zap = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
