"use client";

export default function DispatchBoard() {
    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dispatch Board</h1>
                <p className="text-slate-500 mt-1">Real-time driver tracking and load assignment</p>
            </div>

            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🛰️</div>
                <h2 className="text-2xl font-bold text-slate-900">Live Dispatch View Coming Soon</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    {"We're integrating real-time GPS tracking and drag-and-drop load scheduling."}
                    Stay tuned for the ultimate dispatching experience!
                </p>
            </div>
        </main>
    );
}
