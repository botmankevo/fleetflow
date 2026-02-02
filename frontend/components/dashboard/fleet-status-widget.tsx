"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Truck, TrendingUp, AlertCircle, CheckCircle, Wrench } from "lucide-react";

const fleetData = {
    totalVehicles: 48,
    trucks: 32,
    trailers: 16,
    active: 38,
    idle: 6,
    maintenance: 4,
    utilizationRate: 79.2,
    utilizationTrend: "+5.3%"
};

export function FleetStatusWidget() {
    return (
        <GlassCard className="p-6" gradient>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Fleet Status</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Real-time vehicle deployment overview</p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10">
                    <Truck className="w-5 h-5 text-primary" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-secondary/30 border border-glass-border/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Fleet</p>
                    <h4 className="text-3xl font-bold text-foreground">{fleetData.totalVehicles}</h4>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none text-[9px] font-bold">
                            {fleetData.trucks} Trucks
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-none text-[9px] font-bold">
                            {fleetData.trailers} Trailers
                        </Badge>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 border border-glass-border/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Utilization</p>
                    <h4 className="text-3xl font-bold text-foreground">{fleetData.utilizationRate}%</h4>
                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600">{fleetData.utilizationTrend}</span>
                        <span className="text-[9px] text-muted-foreground ml-1">vs last week</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Active Units</p>
                            <p className="text-[10px] text-muted-foreground">Deployed on routes</p>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-emerald-600">{fleetData.active}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Idle Units</p>
                            <p className="text-[10px] text-muted-foreground">Available for dispatch</p>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-amber-600">{fleetData.idle}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
                            <Wrench className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">In Maintenance</p>
                            <p className="text-[10px] text-muted-foreground">Service in progress</p>
                        </div>
                    </div>
                    <Badge variant="destructive" className="text-xs font-bold">
                        {fleetData.maintenance}
                    </Badge>
                </div>
            </div>
        </GlassCard>
    );
}
