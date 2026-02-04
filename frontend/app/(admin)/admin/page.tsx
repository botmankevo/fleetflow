"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage, getToken } from "../../../lib/api";
import {
  Truck,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Download,
  ArrowRight,
  MoreVertical,
  MapPin,
  Clock,
  ShieldCheck
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { WidgetContainer } from "@/components/dashboard/widget-container";
import { FleetStatusWidget } from "@/components/dashboard/fleet-status-widget";
import { MaintenanceSchedulerWidget } from "@/components/dashboard/maintenance-scheduler-widget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Load = {
  id: number;
  load_number?: string | null;
  pickup_address: string;
  delivery_address: string;
  status?: string | null;
  driver_id?: number | null;
};

type Driver = {
  id: number;
  name: string;
  email?: string | null;
};

export default function AdminDashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({
    loadNumber: "",
    status: "Created",
    pickup: "",
    delivery: "",
    notes: "",
    driverId: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        await fetchDrivers();
        await fetchLoads();
        setReady(true);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load"));
      }
    })();
  }, [router]);

  async function fetchDrivers() {
    try {
      const token = getToken();
      const res = await apiFetch("/drivers", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setDrivers(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load drivers"));
    }
  }

  async function fetchLoads() {
    try {
      const token = getToken();
      const res = await apiFetch("/loads", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setLoads(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load"));
    }
  }

  async function createLoad(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch("/loads", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          load_number: form.loadNumber,
          status: form.status,
          pickup_address: form.pickup,
          delivery_address: form.delivery,
          notes: form.notes,
          driver_id: form.driverId ? Number(form.driverId) : null,
        }),
      });
      setForm({ loadNumber: "", status: "Created", pickup: "", delivery: "", notes: "", driverId: "" });
      await fetchLoads();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create load"));
    } finally {
      setCreating(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">Synchronizing fleet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="animate-in slide-in-from-left duration-500">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Operations Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3 animate-in slide-in-from-right duration-500">
          <Button variant="outline" size="sm" className="rounded-xl border-glass-border">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button variant="gradient" size="sm" className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> New shipment
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Loads", value: loads.length, icon: Truck, trend: "+12%", color: "text-primary", link: "/admin/loads", filter: "status=active" },
          { label: "On-Duty Drivers", value: drivers.length, icon: Users, trend: "4 idle", color: "text-blue-500", link: "/admin/drivers", filter: "status=on-duty" },
          { label: "On-Time Rate", value: "94.8%", icon: CheckCircle2, trend: "+2.1%", color: "text-emerald-500", link: null },
          { label: "Safety Score", value: "9.2", icon: ShieldCheck, trend: "Pinnacle", color: "text-amber-500", link: null },
        ].map((kpi, i) => (
          <GlassCard 
            key={i} 
            className="p-5 group hover:scale-[1.02] cursor-pointer" 
            gradient
            onClick={() => kpi.link && router.push(kpi.link + (kpi.filter ? `?${kpi.filter}` : ''))}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{kpi.value}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl bg-secondary/50 group-hover:scale-110 transition-transform", kpi.color)}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">
                <TrendingUp className="w-3 h-3 mr-1" /> {kpi.trend}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-medium">vs last month</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <WidgetContainer
            title="Real-time Shipments"
            description="Active fleet status and route monitoring"
            action={
              <Link href="/admin/loads" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                Manage Board <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <GlassCard className="p-0 overflow-hidden border-glass-border/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-secondary/30 border-b border-glass-border/50">
                      <th className="px-6 py-4 font-bold text-foreground uppercase tracking-widest text-[10px]">Reference #</th>
                      <th className="px-6 py-4 font-bold text-foreground uppercase tracking-widest text-[10px]">Route Configuration</th>
                      <th className="px-6 py-4 font-bold text-foreground uppercase tracking-widest text-[10px]">Status</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/20">
                    {loads.slice(0, 6).map((l) => (
                      <tr key={l.id} className="hover:bg-secondary/30 transition-colors group">
                        <td className="px-6 py-4 font-bold text-foreground">
                          <Link href={`/admin/loads/${l.id}`} className="hover:text-primary transition-colors">
                            {l.load_number || `#${l.id}`}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {l.pickup_address}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 ml-3.5">
                            <MapPin className="w-3 h-3" /> {l.delivery_address}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold">
                          <Badge
                            className={cn(
                              "rounded-lg px-2 py-0.5 border-none",
                              l.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/20 text-primary'
                            )}
                          >
                            {l.status || "Active"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {loads.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic font-medium">
                          No active shipments detected in orbit.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </WidgetContainer>
        </section>

        <section className="space-y-8">
          <WidgetContainer title="Streamline Dispatch">
            <GlassCard className="bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden group" gradient>
              <div className="relative z-10 p-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">Quick Deployment</h3>
                    <p className="text-[10px] text-white/70">Initialize new transport load</p>
                  </div>
                </div>
                <form onSubmit={createLoad} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase opacity-70 ml-1">Manifest #</label>
                    <input
                      className="w-full h-11 bg-white/10 border border-white/20 rounded-xl px-4 text-sm text-white placeholder:text-white/40 focus:bg-white focus:text-slate-900 outline-none transition-all"
                      placeholder="e.g. SHIP-2024-X"
                      value={form.loadNumber}
                      onChange={(e) => setForm({ ...form, loadNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase opacity-70 ml-1">Path Configuration</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="h-11 bg-white/10 border border-white/20 rounded-xl px-4 text-xs text-white placeholder:text-white/40 focus:bg-white focus:text-slate-900 outline-none transition-all"
                        placeholder="Origin"
                        value={form.pickup}
                        onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                        required
                      />
                      <input
                        className="h-11 bg-white/10 border border-white/20 rounded-xl px-4 text-xs text-white placeholder:text-white/40 focus:bg-white focus:text-slate-900 outline-none transition-all"
                        placeholder="Destination"
                        value={form.delivery}
                        onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-white text-primary font-bold rounded-xl hover:bg-white/90 active:scale-95 shadow-lg"
                    disabled={creating}
                  >
                    {creating ? "Deploying..." : "Initialize Shipment"}
                  </Button>
                </form>
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            </GlassCard>
          </WidgetContainer>

          <WidgetContainer
            title="Live Fleet"
            description="Active responders and status"
            action={<span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE TRACKING</span>}
          >
            <GlassCard className="p-4 space-y-4">
              {drivers.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center font-bold text-primary border border-glass-border/30 group-hover:border-primary/50 transition-colors">
                      {d.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{d.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">On-Duty • Active Route</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-bold">TR-0{d.id}</Badge>
                </div>
              ))}
              {drivers.length === 0 && <p className="text-xs text-muted-foreground text-center py-8 font-medium">No drivers active in the grid.</p>}
              <Button variant="ghost" className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                View All Units
              </Button>
            </GlassCard>
          </WidgetContainer>
        </section>
      </div>

      {/* Fleet Operations Section */}
      <WidgetContainer
        title="Fleet Operations"
        description="Vehicle management and maintenance oversight"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FleetStatusWidget />
          <MaintenanceSchedulerWidget />
        </div>
      </WidgetContainer>
    </div>
  );
}
