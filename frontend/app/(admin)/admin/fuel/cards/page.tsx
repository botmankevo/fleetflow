"use client";

export default function FuelCards() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fuel Cards</h1>
                <p className="text-slate-500 mt-1">Manage fleet fuel card assignments and limits</p>
            </div>

            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">💳</div>
                <h2 className="text-2xl font-bold text-slate-900">Fuel Card Management</h2>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    Integration with Wex, Comdata, and Pilot Flying J coming soon.
                    Track card status and assign to drivers in real-time.
                </p>
            </div>
        </main>
    );
}
