"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const COLORS = ["#6366f1", "#7c3aed", "#22c55e", "#f59e0b", "#ef4444"];

type LoadStat = { status: string; count: number };
type RevenueStat = { month: string; estimated_revenue: number; loads_count: number };
type EquipmentStat = { status: string; count: number };

export default function AnalyticsPage() {
    const [loadStatus, setLoadStatus] = useState<LoadStat[]>([]);
    const [revenue, setRevenue] = useState<RevenueStat[]>([]);
    const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const token = getToken();
                const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

                const [ls, rev, eq] = await Promise.all([
                    apiFetch("/analytics/load-status", { headers }),
                    apiFetch("/analytics/revenue", { headers }),
                    apiFetch("/analytics/equipment-status", { headers }),
                ]);

                setLoadStatus(ls);
                setRevenue(rev);
                setEquipmentStatus(eq);
            } catch (err) {
                setError(getErrorMessage(err, "Failed to load analytics"));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="p-8 text-slateSoft">Analyzing fleet data...</div>;

    return (
        <div className="space-y-8 pb-12">
            <header>
                <h1 className="text-3xl font-bold text-slate">Fleet Analytics</h1>
                <p className="text-slateSoft mt-1">Real-time performance metrics and business intelligence.</p>
            </header>

            {error && <div className="bg-error/10 text-error p-4 rounded-xl">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="card lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate mb-6">Revenue & Load Volume</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenue}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="estimated_revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="loads_count" stroke="#7c3aed" strokeWidth={3} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Load Status Distribution */}
                <div className="card">
                    <h2 className="text-lg font-bold text-slate mb-6">Load Status Distribution</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={loadStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="status"
                                >
                                    {loadStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {loadStatus.map((entry, index) => (
                            <div key={entry.status} className="flex items-center gap-2 text-xs">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-slate capitalize">{entry.status}: <span className="font-bold">{entry.count}</span></span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equipment Utilization */}
                <div className="card">
                    <h2 className="text-lg font-bold text-slate mb-6">Equipment Availability</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={equipmentStatus}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {equipmentStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.status === 'available' ? '#22c55e' : entry.status === 'maintenance' ? '#ef4444' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
