"use client";

export default function AccountingDashboard() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Accounting Suite</h1>
                <p className="text-slate-500 mt-1">Invoicing, factoring, and financial reporting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {["Invoices", "Factoring", "Chart of Accounts", "Vendor Balances"].map(module => (
                    <div key={module} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{module}</div>
                        <div className="text-xs text-slate-400 mt-1">Click to open module</div>
                    </div>
                ))}
            </div>
        </main>
    );
}
