"use client";

export default function TollsManagement() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tolls & Transponders</h1>
                <p className="text-slate-500 mt-1">Track E-ZPass, PrePass, and toll transactions across the fleet</p>
            </div>

            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🛣️</div>
                <h2 className="text-2xl font-bold text-slate-900">Toll Tracking Coming Soon</h2>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    Integration with Bestpass and I-Pass for automated toll reconciliation.
                </p>
            </div>
        </main>
    );
}
