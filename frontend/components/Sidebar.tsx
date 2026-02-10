"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "../lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Truck, 
  BarChart3, 
  Users, 
  Building2, 
  Store, 
  Tractor, 
  Fuel, 
  CreditCard, 
  Milestone, 
  Banknote, 
  Calculator, 
  Receipt, 
  ShieldCheck, 
  FileText, 
  Settings,
  Menu,
  X,
  FileCheck,
  DollarSign,
  Search,
  MessageSquare,
  MapPin,
  Package
} from "lucide-react";
import { useState } from "react";

const navigation = [
    {
        title: "Operations",
        items: [
            { name: "Overview", href: "/admin", icon: LayoutDashboard },
            { name: "Dispatch", href: "/admin/dispatch", icon: ClipboardList },
            { name: "Loads", href: "/admin/loads", icon: Truck },
            { name: "Docs Exchange", href: "/admin/docs-exchange", icon: FileCheck },
            { name: "POD History", href: "/admin/pod-history", icon: FileCheck },
            { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        ]
    },
    {
        title: "Partners",
        items: [
            { name: "Drivers", href: "/admin/drivers", icon: Users },
            { name: "Customers", href: "/admin/customers", icon: Building2 },
            { name: "Vendors", href: "/admin/vendors", icon: Store },
        ]
    },
    {
        title: "Fleet",
        items: [
            { name: "Equipment", href: "/admin/equipment", icon: Tractor },
            { name: "Maintenance", href: "/admin/maintenance", icon: Settings },
        ]
    },
    {
        title: "Logistics",
        items: [
            { name: "Fuel Cards", href: "/admin/fuel/cards", icon: CreditCard },
            { name: "Fuel Logs", href: "/admin/fuel/transactions", icon: Fuel },
            { name: "Tolls", href: "/admin/tolls", icon: Milestone },
        ]
    },
    {
        title: "Financials",
        items: [
            { name: "Payroll", href: "/admin/payroll", icon: Banknote },
            { name: "Accounting", href: "/admin/accounting", icon: Calculator },
            { name: "Invoices", href: "/admin/invoices", icon: Receipt },
            { name: "Expenses", href: "/admin/expenses", icon: Package },
        ]
    },
    {
        title: "Integrations",
        items: [
            { name: "QuickBooks", href: "/admin/quickbooks", icon: DollarSign },
            { name: "Load Boards", href: "/admin/loadboards", icon: Search },
            { name: "Communications", href: "/admin/communications", icon: MessageSquare },
            { name: "Live Tracking", href: "/admin/tracking", icon: MapPin },
        ]
    },
    {
        title: "Admin",
        items: [
            { name: "Safety", href: "/admin/safety", icon: ShieldCheck },
            { name: "IFTA", href: "/admin/ifta", icon: FileText },
            { name: "Users", href: "/admin/users", icon: Users },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle */}
            <button 
                className="lg:hidden fixed top-4 left-4 z-[60] p-2 glass-card rounded-xl border-glass-border"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[45] lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "w-64 border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 bg-white shadow-sm",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-200 relative">
                    <div className="flex items-center gap-3">
                        <img src="/maintms-logo.png" alt="MainTMS" className="h-10 w-auto object-contain" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold">MainTMS</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium -mt-1">Transport Management</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-hidden">
                    {navigation.map((group) => (
                        <div key={group.title} className="space-y-1">
                            <h4 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-50">
                                {group.title}
                            </h4>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-sm font-medium",
                                                active
                                                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                                    : "text-secondary-foreground hover:bg-secondary/50 hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={cn(
                                                    "w-4.5 h-4.5 transition-transform duration-200",
                                                    active ? "scale-110" : "group-hover:scale-110 text-muted-foreground group-hover:text-foreground"
                                                )} />
                                                <span>{item.name}</span>
                                            </div>
                                            {item.badge && (
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                                                    active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                                )}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t space-y-3">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-medium text-muted-foreground">Theme</span>
                        <ThemeToggle />
                    </div>
                    
                    {/* Settings Link */}
                    <Link
                        href="/admin/account"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200",
                            pathname === "/admin/account" && "bg-secondary text-foreground"
                        )}
                    >
                        <Settings className="w-4.5 h-4.5" />
                        <span>Settings</span>
                    </Link>
                </div>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0,0,0,0.05);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(0,0,0,0.1);
                    }
                `}</style>
            </aside>
        </>
    );
}
