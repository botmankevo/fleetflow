"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Truck,
  Users,
  DollarSign,
  BarChart3,
  Package,
  Settings,
  FileText,
  Calendar,
  MapPin,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

type CommandItem = {
  id: string;
  title: string;
  description?: string;
  icon: any;
  action: () => void;
  category: string;
  keywords: string[];
};

export default function AICommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Command definitions
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-loads",
      title: "View All Loads",
      description: "Browse and manage all loads",
      icon: Truck,
      action: () => router.push("/admin/loads"),
      category: "Navigation",
      keywords: ["loads", "shipments", "freight"],
    },
    {
      id: "nav-drivers",
      title: "View All Drivers",
      description: "Manage driver roster",
      icon: Users,
      action: () => router.push("/admin/drivers"),
      category: "Navigation",
      keywords: ["drivers", "employees", "team"],
    },
    {
      id: "nav-dispatch",
      title: "Open Dispatch Board",
      description: "Kanban-style load assignment",
      icon: Package,
      action: () => router.push("/admin/dispatch"),
      category: "Navigation",
      keywords: ["dispatch", "assign", "kanban"],
    },
    {
      id: "nav-analytics",
      title: "View Analytics",
      description: "Performance metrics and insights",
      icon: BarChart3,
      action: () => router.push("/admin/analytics"),
      category: "Navigation",
      keywords: ["analytics", "reports", "metrics", "dashboard"],
    },
    {
      id: "nav-expenses",
      title: "View Expenses",
      description: "Track operational costs",
      icon: DollarSign,
      action: () => router.push("/admin/expenses"),
      category: "Navigation",
      keywords: ["expenses", "costs", "spending"],
    },
    {
      id: "nav-maintenance",
      title: "View Maintenance",
      description: "Equipment service tracking",
      icon: Settings,
      action: () => router.push("/admin/maintenance"),
      category: "Navigation",
      keywords: ["maintenance", "service", "repairs"],
    },

    // Quick Actions
    {
      id: "action-new-load",
      title: "Create New Load",
      description: "Add a new shipment",
      icon: Truck,
      action: () => router.push("/admin/loads?action=create"),
      category: "Quick Actions",
      keywords: ["create", "new", "add", "load"],
    },
    {
      id: "action-assign-driver",
      title: "Assign Driver to Load",
      description: "Quick driver assignment",
      icon: Users,
      action: () => router.push("/admin/dispatch"),
      category: "Quick Actions",
      keywords: ["assign", "driver", "dispatch"],
    },
    {
      id: "action-record-expense",
      title: "Record Expense",
      description: "Log a new expense",
      icon: DollarSign,
      action: () => router.push("/admin/expenses?action=create"),
      category: "Quick Actions",
      keywords: ["expense", "cost", "record"],
    },

    // AI Features
    {
      id: "ai-insights",
      title: "AI Insights",
      description: "View AI-generated recommendations",
      icon: Zap,
      action: () => router.push("/admin?section=insights"),
      category: "AI Features",
      keywords: ["ai", "insights", "recommendations", "suggestions"],
    },
    {
      id: "ai-predict-delays",
      title: "Predict Delays",
      description: "AI delay risk analysis",
      icon: AlertCircle,
      action: () => alert("Opening AI Delay Predictions..."),
      category: "AI Features",
      keywords: ["predict", "delays", "risk", "ai"],
    },
    {
      id: "ai-optimize",
      title: "Optimize Routes",
      description: "AI-powered route optimization",
      icon: MapPin,
      action: () => alert("Opening Route Optimizer..."),
      category: "AI Features",
      keywords: ["optimize", "routes", "ai", "efficiency"],
    },
    {
      id: "ai-auto-assign",
      title: "Auto-Assign Loads",
      description: "Let AI assign drivers intelligently",
      icon: Zap,
      action: () => alert("AI Auto-Assignment started..."),
      category: "AI Features",
      keywords: ["auto", "assign", "ai", "automatic"],
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.includes(searchLower))
    );
  });

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open/close with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch("");
        setSelectedIndex(0);
      }

      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearch("");
        setSelectedIndex(0);
      }

      // Navigate with arrow keys
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            selected.action();
            setIsOpen(false);
            setSearch("");
            setSelectedIndex(0);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="mx-4 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl glow-primary overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-glass-border">
            <Search className="w-5 h-5 text-primary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands, features, or ask AI..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
              autoFocus
            />
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold ai-text">
              ESC
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg-main flex items-center justify-center">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <p className="text-muted-foreground">No results found for "{search}"</p>
                <p className="text-xs text-muted-foreground mt-2">Try different keywords or clear search</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {category}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {items.map((cmd, idx) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = cmd.icon;

                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action();
                            setIsOpen(false);
                            setSearch("");
                            setSelectedIndex(0);
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group",
                            isSelected
                              ? "bg-primary/10 border-primary/30 border"
                              : "hover:bg-secondary/50 border border-transparent"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                              isSelected
                                ? "gradient-bg-main glow-primary"
                                : "bg-secondary/50 group-hover:bg-primary/10"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isSelected ? "text-white" : "text-muted-foreground group-hover:text-primary"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium transition-colors",
                                isSelected ? "text-primary" : "text-foreground"
                              )}
                            >
                              {cmd.title}
                            </p>
                            {cmd.description && (
                              <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-accent/10 text-accent text-xs font-bold">
                              ↵
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-glass-border bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border border-glass-border">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-background border border-glass-border">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border border-glass-border">↵</kbd>
                Select
              </span>
            </div>
            <span className="ai-text text-primary">AI-Powered Search</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 163, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 163, 255, 0.4);
        }
      `}</style>
    </>
  );
}
