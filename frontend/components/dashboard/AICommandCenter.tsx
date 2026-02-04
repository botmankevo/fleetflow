"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { apiFetch, getToken } from "../../lib/api";

type Insight = {
  title: string;
  message: string;
  priority: string;
  action_label?: string;
  action_url?: string;
  icon: string;
};

export default function AICommandCenter() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  useEffect(() => {
    if (insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
      }, 8000); // Rotate every 8 seconds

      return () => clearInterval(interval);
    }
  }, [insights]);

  async function fetchInsights() {
    try {
      const token = getToken();
      const data = await apiFetch("/ai/insights", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setInsights(data);
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
      // Fallback insight
      setInsights([
        {
          title: "AI Ready",
          message: "Your AI assistant is ready to help optimize operations.",
          priority: "low",
          action_label: "Get Started",
          icon: "sparkles",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="ai-command-bar mb-8 animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-animated flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-secondary rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  const currentInsight = insights[currentIndex];
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "trending-up":
        return TrendingUp;
      case "alert-circle":
        return AlertCircle;
      case "check-circle":
        return CheckCircle2;
      case "zap":
        return Zap;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon(currentInsight.icon);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-yellow-500";
      case "medium":
        return "text-primary";
      default:
        return "text-accent";
    }
  };

  return (
    <div className="ai-command-bar mb-8 animate-in fade-in slide-in-from-top duration-700 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-animated opacity-10"></div>
      
      <div className="relative z-10 flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl gradient-bg-main flex items-center justify-center pulse-glow">
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="ai-text text-primary text-xs font-bold uppercase tracking-wider">
              AI {currentInsight.title}
            </span>
            {insights.length > 1 && (
              <span className="text-[10px] text-muted-foreground">
                {currentIndex + 1} of {insights.length}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            {currentInsight.message}
          </p>
        </div>

        {currentInsight.action_label && (
          <Button
            size="sm"
            className="gradient-bg-main text-white hover:scale-105 transition-transform rounded-lg shrink-0"
            onClick={() => {
              if (currentInsight.action_url) {
                window.location.href = currentInsight.action_url;
              }
            }}
          >
            {currentInsight.action_label}
          </Button>
        )}

        {/* Navigation dots */}
        {insights.length > 1 && (
          <div className="flex gap-1.5 shrink-0">
            {insights.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
