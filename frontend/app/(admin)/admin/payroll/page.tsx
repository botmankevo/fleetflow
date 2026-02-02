"use client";

export default function PayrollManagement() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Driver Payroll</h1>
                <p className="text-slate-500 mt-1">Settlements, earnings, and deductions oversight</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Next Payout</span>
                    <div className="text-2xl font-bold text-slate-900">$12,450.00</div>
                    <div className="text-xs text-emerald-600 font-semibold">Feb 5, 2026</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Settlements</span>
                    <div className="text-2xl font-bold text-slate-900">8 Loads</div>
                    <div className="text-xs text-amber-600 font-semibold">Awaiting POD Approval</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">MTD Total</span>
                    <div className="text-2xl font-bold text-slate-900">$84,200.00</div>
                    <div className="text-xs text-indigo-600 font-semibold">+12% from last month</div>
                </div>
            </div>

            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <p className="text-slate-400 font-medium italic">Detailed payroll ledger integration in progress...</p>
            </div>
        </main>
    );
}
