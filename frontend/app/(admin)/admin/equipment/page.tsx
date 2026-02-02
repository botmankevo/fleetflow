"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type Equipment = {
    id: number;
    equipment_type: string;
    identifier: string;
    status: string;
    assigned_load_id?: number | null;
};

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        type: "truck",
        identifier: "",
    });

    useEffect(() => {
        fetchEquipment();
    }, []);

    async function fetchEquipment() {
        try {
            const token = getToken();
            const res = await apiFetch("/equipment", {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            setEquipment(res);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to load equipment"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        try {
            const token = getToken();
            await apiFetch("/equipment", {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    equipment_type: form.type,
                    identifier: form.identifier,
                    status: "available",
                }),
            });
            setForm({ ...form, identifier: "" });
            await fetchEquipment();
        } catch (err) {
            setError(getErrorMessage(err, "Failed to create equipment"));
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate">Fleet Equipment</h1>
                    <p className="text-slateSoft mt-1">Manage your trucks, trailers, and other assets.</p>
                </div>
            </header>

            {error && (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="card">
                        <h2 className="text-lg font-bold text-slate mb-6">Inventory</h2>
                        <div className="overflow-hidden border border-border rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-panel border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slateSoft uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 font-semibold text-slateSoft uppercase tracking-wider">Identifier</th>
                                        <th className="px-4 py-3 font-semibold text-slateSoft uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 font-semibold text-slateSoft uppercase tracking-wider">Assignment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {equipment.map((item) => (
                                        <tr key={item.id} className="hover:bg-panel transition-colors">
                                            <td className="px-4 py-4 capitalize text-slate">{item.equipment_type}</td>
                                            <td className="px-4 py-4 font-medium text-slate uppercase">{item.identifier}</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'available' ? 'bg-success/10 text-success' :
                                                    item.status === 'maintenance' ? 'bg-error/10 text-error' :
                                                        'bg-primary/10 text-primary'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-slateSoft">
                                                {item.assigned_load_id ? `Active Load #${item.assigned_load_id}` : "Unassigned"}
                                            </td>
                                        </tr>
                                    ))}
                                    {equipment.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slateSoft italic">
                                                No equipment found. Add your first asset.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="card bg-primary text-white border-none shadow-premium">
                        <h3 className="text-lg font-bold mb-4">Add Asset</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-white/70 uppercase">Asset Type</label>
                                <select
                                    className="input w-full bg-white/10 border-white/20 text-white focus:bg-white focus:text-slate"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="truck">Truck</option>
                                    <option value="trailer">Trailer</option>
                                    <option value="reefer">Reefer</option>
                                    <option value="flatbed">Flatbed</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-white/70 uppercase">Identifier (Unit # / Plate)</label>
                                <input
                                    className="input w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white focus:text-slate"
                                    placeholder="e.g. TR-90210"
                                    value={form.identifier}
                                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                                    required
                                />
                            </div>
                            <button
                                className="w-full py-3 bg-white text-primary font-bold rounded-xl hover:bg-panel transition-all disabled:opacity-50"
                                disabled={creating}
                            >
                                {creating ? "Adding..." : "Add to Fleet"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
