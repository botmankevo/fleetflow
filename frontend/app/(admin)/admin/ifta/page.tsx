"use client";

export default function IFTAReports() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">IFTA Management</h1>
                <p className="text-slate-500 mt-1">Fuel tax reporting and distance tracking across jurisdictions</p>
            </div>

            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📝</div>
                <h2 className="text-2xl font-bold text-slate-900">Tax Reporting</h2>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    Quarterly IFTA calculations and automated report generation.
                </p>
            </div>
        </main>
    );
}
