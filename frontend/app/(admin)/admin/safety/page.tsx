"use client";

export default function SafetyCompliance() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Safety & Compliance</h1>
                <p className="text-slate-500 mt-1">ELDS, violations, and safety audit preparation</p>
            </div>

            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🛡️</div>
                <h2 className="text-2xl font-bold text-slate-900">Safety Oversight</h2>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    {"Automated drug & alcohol clearinghouse checks and violation tracking."}
                </p>
            </div>
        </main>
    );
}
