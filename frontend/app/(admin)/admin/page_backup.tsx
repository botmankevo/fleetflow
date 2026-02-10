"use client";

import { useState, useEffect } from "react";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeLoads: 0,
    availableDrivers: 0,
    revenue: "$0",
    utilization: "0%",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const loads = await apiFetch("/loads/");
      const drivers = await apiFetch("/drivers/");
      
      const activeLoads = Array.isArray(loads) 
        ? loads.filter((l: any) => l.status !== 'completed' && l.status !== 'cancelled').length 
        : 0;
      
      const availableDrivers = Array.isArray(drivers)
        ? drivers.filter((d: any) => d.status === 'active').length
        : 0;

      setStats({
        activeLoads: activeLoads,
        availableDrivers: availableDrivers,
        revenue: "$284,500",
        utilization: "87%",
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recentLoads = [
    { id: "LD-4521", origin: "Chicago, IL", dest: "Dallas, TX", status: "In Transit", driver: "Mike Johnson" },
    { id: "LD-4520", origin: "Atlanta, GA", dest: "Miami, FL", status: "Delivered", driver: "Sarah Davis" },
    { id: "LD-4519", origin: "Denver, CO", dest: "Phoenix, AZ", status: "Assigned", driver: "Tom Wilson" },
    { id: "LD-4518", origin: "Seattle, WA", dest: "Portland, OR", status: "In Transit", driver: "James Brown" },
    { id: "LD-4517", origin: "New York, NY", dest: "Boston, MA", status: "Delivered", driver: "Lisa Chen" },
  ];

  const statusColor: Record<string, string> = {
    "In Transit": "bg-primary/10 text-primary border-primary/20",
    Delivered: "bg-success/10 text-success border-success/20",
    Assigned: "bg-warning/10 text-warning border-warning/20",
  };

  const alerts = [
    { message: "Driver Mike Johnson HOS approaching limit", type: "warning" },
    { message: "Truck #T-204 maintenance overdue", type: "error" },
    { message: "Invoice #INV-892 payment received", type: "success" },
    { message: "New load posted on DAT board", type: "info" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back — here's your fleet overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Active Loads" 
          value={stats.activeLoads.toString()} 
          change="+12% from last week" 
          changeType="positive" 
          icon={Package} 
        />
        <StatsCard 
          title="Available Drivers" 
          value={stats.availableDrivers.toString()} 
          change="3 on break" 
          changeType="neutral" 
          icon={Users} 
        />
        <StatsCard 
          title="Revenue (MTD)" 
          value={stats.revenue} 
          change="+8.2% vs last month" 
          changeType="positive" 
          icon={DollarSign} 
        />
        <StatsCard 
          title="Fleet Utilization" 
          value={stats.utilization} 
          change="+3% from last week" 
          changeType="positive" 
          icon={Truck} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Recent Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLoads.map((load) => (
                <div
                  key={load.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono font-medium text-primary">{load.id}</span>
                    <div className="text-sm">
                      <span className="text-foreground">{load.origin}</span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="text-foreground">{load.dest}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:block">{load.driver}</span>
                    <Badge variant="outline" className={statusColor[load.status]}>
                      {load.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                  {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />}
                  {alert.type === "error" && <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                  {alert.type === "success" && <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />}
                  {alert.type === "info" && <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                  <p className="text-sm text-foreground">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
