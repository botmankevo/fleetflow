"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Wrench, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const maintenanceSchedule = [
    {
        id: 1,
        vehicleId: "TRK-2401",
        type: "Oil Change",
        dueDate: "2024-02-05",
        priority: "routine",
        daysUntil: 2
    },
    {
        id: 2,
        vehicleId: "TRL-1803",
        type: "Brake Inspection",
        dueDate: "2024-02-04",
        priority: "critical",
        daysUntil: 1
    },
    {
        id: 3,
        vehicleId: "TRK-2398",
        type: "Tire Rotation",
        dueDate: "2024-02-07",
        priority: "scheduled",
        daysUntil: 4
    },
    {
        id: 4,
        vehicleId: "TRK-2405",
        type: "Annual DOT Inspection",
        dueDate: "2024-02-06",
        priority: "critical",
        daysUntil: 3
    }
];

const priorityConfig = {
    critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Critical" },
    routine: { color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Routine" },
    scheduled: { color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Scheduled" }
};

export function MaintenanceSchedulerWidget() {
    return (
        <GlassCard className="p-6" gradient>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Maintenance Schedule</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Upcoming service and inspections</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <Wrench className="w-5 h-5 text-amber-600" />
                </div>
            </div>

            <div className="space-y-3 mb-6">
                {maintenanceSchedule.map((item) => {
                    const config = priorityConfig[item.priority as keyof typeof priorityConfig];
                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "p-4 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer group",
                                config.bg,
                                config.border
                            )}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-foreground">{item.vehicleId}</span>
                                        <Badge
                                            variant="secondary"
                                            className={cn("text-[9px] font-bold border-none", config.bg, config.color)}
                                        >
                                            {config.label}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.type}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>

                            <div className="flex items-center gap-4 text-[10px]">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground font-medium">{item.dueDate}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className={cn("font-bold", item.daysUntil <= 1 ? config.color : "text-muted-foreground")}>
                                        {item.daysUntil} {item.daysUntil === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Button
                variant="outline"
                className="w-full rounded-xl border-glass-border hover:bg-secondary/50 text-sm font-bold"
            >
                <Calendar className="w-4 h-4 mr-2" />
                View Full Calendar
            </Button>
        </GlassCard>
    );
}
