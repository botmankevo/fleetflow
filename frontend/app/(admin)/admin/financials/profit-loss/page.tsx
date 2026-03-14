"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { 
    BarChart3, 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    Settings, 
    Plus,
    Truck,
    Building2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatCardEnhanced from "@/components/ui/stat-card-enhanced";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from "recharts";

interface FinancialSettings {
    target_profit_rpm: number;
    warning_rpm: number;
    break_even_rpm: number;
    fuel_cost_per_gallon: number;
    avg_mpg: number;
    monthly_insurance: number;
    monthly_truck_payment: number;
    monthly_permits: number;
    monthly_other_fixed: number;
}

interface ProfitLossData {
    period_label: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    loads_count: number;
    miles_count: number;
}

export default function ProfitLossPage() {
    const [settings, setSettings] = useState<FinancialSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ProfitLossData | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [truckProfitability, setTruckProfitability] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, expensesRes, loadsRes, equipmentRes] = await Promise.all([
                apiFetch("/financials/settings"),
                apiFetch("/expenses"),
                apiFetch("/loads"),
                apiFetch("/equipment")
            ]);

            setSettings(settingsRes);

            // Mocking P&L data processing for the demo feel since backend is still being updated
            // In a real app, these would come from dedicated aggregation endpoints
            const processedData = {
                period_label: "Current Month",
                revenue: loadsRes.filter((l: any) => l.status === "Delivered").reduce((sum: number, l: any) => sum + (l.rate_amount || 0), 0),
                expenses: expensesRes.reduce((sum: number, e: any) => sum + (e.amount / 100), 0),
                loads_count: loadsRes.length,
                miles_count: loadsRes.reduce((sum: number, l: any) => sum + (l.total_miles || 0), 0),
            };

            const profit = processedData.revenue - processedData.expenses;
            const margin = processedData.revenue > 0 ? (profit / processedData.revenue) * 100 : 0;

            setData({ ...processedData, profit, margin });

            // Mock Chart Data
            setChartData([
                { name: 'Jan', revenue: 45000, expenses: 32000 },
                { name: 'Feb', revenue: 52000, expenses: 35000 },
                { name: 'Mar', revenue: 48000, expenses: 38000 },
                { name: 'Apr', revenue: 61000, expenses: 42000 },
            ]);

            // Mock Truck Profitability
            setTruckProfitability(equipmentRes.map((eq: any) => ({
                id: eq.id,
                identifier: eq.identifier,
                revenue: Math.random() * 15000 + 5000,
                expenses: Math.random() * 8000 + 3000,
                profit: 0, // calc below
                margin: 0
            })).map((t: any) => {
                const profit = t.revenue - t.expenses;
                return { ...t, profit, margin: (profit / t.revenue) * 100 };
            }));

        } catch (err) {
            setError(getErrorMessage(err, "Failed to load financial data"));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiFetch("/financials/settings", {
                method: "PATCH",
                body: JSON.stringify(settings)
            });
            setSettings(res);
            alert("Settings updated successfully");
        } catch (err) {
            alert("Failed to update settings");
        }
    };

    if (loading) return <div className="p-8"><div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded"></div>)}
        </div>
    </div></div>;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Profit & Loss" 
                description="Monitor company and truck performance metrics"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Period: This Month
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Button>
                    </div>
                }
            />

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Company Overview
                    </TabsTrigger>
                    <TabsTrigger value="trucks">
                        <Truck className="mr-2 h-4 w-4" />
                        Truck Performance
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Break-even Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-all border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <div className="relative z-10 text-blue-100 font-medium">Total Revenue</div>
                            <div className="relative z-10 text-3xl font-bold mt-1 text-white">${data?.revenue.toLocaleString()}</div>
                            <div className="mt-2 flex items-center text-sm text-blue-100">
                                <ArrowUpRight className="h-4 w-4 mr-1 text-white" />
                                +12% from last month
                            </div>
                            <DollarSign className="absolute -bottom-2 -right-2 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
                        </Card>

                        <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-all border-none bg-gradient-to-br from-red-500 to-red-600 text-white">
                            <div className="relative z-10 text-red-100 font-medium">Total Expenses</div>
                            <div className="relative z-10 text-3xl font-bold mt-1 text-white">${data?.expenses.toLocaleString()}</div>
                            <div className="mt-2 flex items-center text-sm text-red-100">
                                <ArrowUpRight className="h-4 w-4 mr-1 text-white" />
                                +5% from last month
                            </div>
                            <TrendingDown className="absolute -bottom-2 -right-2 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
                        </Card>

                        <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-all border-none bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <div className="relative z-10 text-green-100 font-medium">Net Profit</div>
                            <div className="relative z-10 text-3xl font-bold mt-1 text-white">${data?.profit.toLocaleString()}</div>
                            <div className="mt-2 flex items-center text-sm text-green-100">
                                <ArrowUpRight className="h-4 w-4 mr-1 text-white" />
                                +18.4% from last month
                            </div>
                            <TrendingUp className="absolute -bottom-2 -right-2 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
                        </Card>

                        <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-all border-none bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                            <div className="relative z-10 text-indigo-100 font-medium">Profit Margin</div>
                            <div className="relative z-10 text-3xl font-bold mt-1 text-white">{data?.margin.toFixed(1)}%</div>
                            <div className="mt-2 flex items-center text-sm text-indigo-100">
                                <ArrowUpRight className="h-4 w-4 mr-1 text-white" />
                                Target: 15%
                            </div>
                            <Calculator className="absolute -bottom-2 -right-2 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 p-6">
                            <h3 className="text-lg font-bold mb-6">Revenue vs Expenses Trend</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-6">Expense Breakdown</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Fuel</span>
                                        <span className="font-medium text-gray-900">$12,450 (32%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{width: '32%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Driver Pay</span>
                                        <span className="font-medium text-gray-900">$15,200 (39%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{width: '39%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Maintenance</span>
                                        <span className="font-medium text-gray-900">$4,800 (12%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{width: '12%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Fixed/Insurance</span>
                                        <span className="font-medium text-gray-900">$6,550 (17%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{width: '17%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="trucks">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Truck Profitability Leaderboard</h3>
                            <Button variant="outline" size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Unit Cost
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-gray-500 text-sm">
                                        <th className="pb-4 font-medium px-4">Truck ID</th>
                                        <th className="pb-4 font-medium px-4">Revenue</th>
                                        <th className="pb-4 font-medium px-4">Direct Expenses</th>
                                        <th className="pb-4 font-medium px-4">Net Profit</th>
                                        <th className="pb-4 font-medium px-4">Margin %</th>
                                        <th className="pb-4 font-medium px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {truckProfitability.map((truck) => (
                                        <tr key={truck.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-4 font-bold text-gray-900 flex items-center gap-2">
                                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                                    <Truck className="h-4 w-4" />
                                                </div>
                                                {truck.identifier}
                                            </td>
                                            <td className="py-4 px-4 text-gray-900">${truck.revenue.toLocaleString()}</td>
                                            <td className="py-4 px-4 text-red-600">-${truck.expenses.toLocaleString()}</td>
                                            <td className="py-4 px-4 font-bold text-green-600">${truck.profit.toLocaleString()}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{width: `${truck.margin}%`}}></div>
                                                    </div>
                                                    <span className="font-medium">{truck.margin.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-bold",
                                                    truck.margin > 20 ? "bg-green-100 text-green-700" :
                                                    truck.margin > 10 ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                                )}>
                                                    {truck.margin > 20 ? 'HIGH PROFIT' : truck.margin > 10 ? 'STABLE' : 'WATCH'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6 h-fit">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <Calculator className="mr-2 h-5 w-5 text-blue-600" />
                                Break-even Parameters
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                These values determine your colors for RPM on the load cards.
                            </p>
                            <form onSubmit={handleUpdateSettings} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Target Profit RPM (Green)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                className="pl-9" 
                                                value={settings?.target_profit_rpm} 
                                                onChange={(e) => setSettings({...settings!, target_profit_rpm: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Warning Reach (Yellow)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                className="pl-9" 
                                                value={settings?.warning_rpm}
                                                onChange={(e) => setSettings({...settings!, warning_rpm: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Break-even Point (Red)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                className="pl-9" 
                                                value={settings?.break_even_rpm}
                                                onChange={(e) => setSettings({...settings!, break_even_rpm: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Avg Fuel Price</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                className="pl-9" 
                                                value={settings?.fuel_cost_per_gallon}
                                                onChange={(e) => setSettings({...settings!, fuel_cost_per_gallon: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Save Thresholds</Button>
                            </form>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <Building2 className="mr-2 h-5 w-5 text-indigo-600" />
                                Fixed Monthly Overhead
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Add your fixed monthly costs to help calculate the true break-even point.
                            </p>
                            <form onSubmit={handleUpdateSettings} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-semibold block">Monthly Insurance</label>
                                            <div className="relative mt-1">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input 
                                                    type="number" 
                                                    className="pl-9" 
                                                    value={settings?.monthly_insurance}
                                                    onChange={(e) => setSettings({...settings!, monthly_insurance: parseFloat(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-semibold block">Truck/Trailer Payments</label>
                                            <div className="relative mt-1">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input 
                                                    type="number" 
                                                    className="pl-9" 
                                                    value={settings?.monthly_truck_payment}
                                                    onChange={(e) => setSettings({...settings!, monthly_truck_payment: parseFloat(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-semibold block">Permits & Fees</label>
                                            <div className="relative mt-1">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input 
                                                    type="number" 
                                                    className="pl-9" 
                                                    value={settings?.monthly_permits}
                                                    onChange={(e) => setSettings({...settings!, monthly_permits: parseFloat(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Save Monthly Overhead</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Shield({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>;
}

function FileText({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
