"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Zap, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

type Prediction = {
  title: string;
  value: string;
  change: number;
  confidence: number;
  trend: "up" | "down";
  icon: any;
  color: string;
};

export function AIAnalyticsWidget() {
  const [predictions, setPredictions] = useState<Prediction[]>([
    {
      title: "Revenue Forecast",
      value: "$125,000",
      change: 12.5,
      confidence: 0.85,
      trend: "up",
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Delivery Time",
      value: "2.3 days",
      change: -8.2,
      confidence: 0.92,
      trend: "down",
      icon: Clock,
      color: "text-accent",
    },
    {
      title: "Risk Score",
      value: "Low",
      change: -15.0,
      confidence: 0.78,
      trend: "down",
      icon: CheckCircle2,
      color: "text-accent",
    },
  ]);

  return (
    <div className="ai-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg-main flex items-center justify-center pulse-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground ai-text">AI Predictions</h3>
            <p className="text-xs text-muted-foreground">Next 7 days forecast</p>
          </div>
        </div>
        <div className="ai-badge text-xs">Live</div>
      </div>

      <div className="space-y-3">
        {predictions.map((pred, idx) => {
          const Icon = pred.icon;
          const TrendIcon = pred.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-secondary/30 border border-glass-border hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", pred.color)} />
                  <span className="text-sm font-medium text-foreground">{pred.title}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-bold text-primary">{(pred.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground ai-text">{pred.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon className={cn("w-3 h-3", pred.change > 0 ? "text-accent" : "text-accent")} />
                    <span className={cn("text-xs font-medium", pred.change > 0 ? "text-accent" : "text-accent")}>
                      {Math.abs(pred.change)}% {pred.trend === "up" ? "increase" : "improvement"}
                    </span>
                  </div>
                </div>
                
                {/* Confidence bar */}
                <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-bg-main transition-all"
                    style={{ width: `${pred.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
        View Detailed Analysis
      </button>
    </div>
  );
}

export function AIInsightsWidget() {
  const insights = [
    {
      type: "success",
      message: "3 loads ready for dispatch with optimal driver availability",
      action: "Dispatch Now",
      icon: CheckCircle2,
    },
    {
      type: "warning",
      message: "Load #1247 approaching deadline - recommend priority assignment",
      action: "View Load",
      icon: AlertTriangle,
    },
    {
      type: "info",
      message: "Route optimization could save $450 on next 5 loads",
      action: "Optimize",
      icon: Zap,
    },
  ];

  return (
    <div className="ai-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg-accent flex items-center justify-center pulse-glow-accent">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground ai-text">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Real-time recommendations</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          const colors = {
            success: "border-accent/30 bg-accent/5",
            warning: "border-yellow-500/30 bg-yellow-500/5",
            info: "border-primary/30 bg-primary/5",
          };
          
          return (
            <div
              key={idx}
              className={cn(
                "p-4 rounded-xl border transition-all hover:scale-[1.02]",
                colors[insight.type as keyof typeof colors]
              )}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={cn(
                    "w-5 h-5 mt-0.5",
                    insight.type === "success" ? "text-accent" : 
                    insight.type === "warning" ? "text-yellow-500" : "text-primary"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                  <button className="text-xs font-medium text-primary hover:text-primary/80 mt-2">
                    {insight.action} →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AIPerformanceWidget() {
  const metrics = [
    { label: "AI Accuracy", value: 94.8, target: 95, color: "text-accent" },
    { label: "Prediction Success", value: 87.5, target: 90, color: "text-primary" },
    { label: "Auto-Assignment", value: 92.0, target: 85, color: "text-accent" },
  ];

  return (
    <div className="ai-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg-main flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground ai-text">AI Performance</h3>
            <p className="text-xs text-muted-foreground">System metrics</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{metric.label}</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold ai-text", metric.color)}>
                  {metric.value}%
                </span>
                {metric.value >= metric.target ? (
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                ) : (
                  <span className="text-xs text-muted-foreground">Target: {metric.target}%</span>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  metric.value >= metric.target ? "gradient-bg-accent" : "gradient-bg-main"
                )}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-glass-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Overall AI Health</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-accent rounded-full pulse-glow-accent"></div>
            <span className="font-bold text-accent">Excellent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
