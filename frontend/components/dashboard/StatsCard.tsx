import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string;
    description?: string;
    trend?: string;
    trendType?: "positive" | "negative" | "neutral";
    icon: LucideIcon;
    className?: string;
}

export function StatsCard({
    title,
    value,
    description,
    trend,
    trendType = "neutral",
    icon: Icon,
    className
}: StatsCardProps) {
    return (
        <Card className={cn("hover:shadow-md transition-shadow", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {trend && (
                            <span className={cn(
                                "flex items-center font-medium mr-2",
                                trendType === "positive" && "text-green-600 dark:text-green-400",
                                trendType === "negative" && "text-red-600 dark:text-red-400",
                                trendType === "neutral" && "text-yellow-600 dark:text-yellow-400",
                            )}>
                                {trendType === "positive" && <ArrowUpRight className="h-3 w-3 mr-1" />}
                                {trendType === "negative" && <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {trendType === "neutral" && <ArrowRight className="h-3 w-3 mr-1" />}
                                {trend}
                            </span>
                        )}
                        {description && <span>{description}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
