"use client";

import {
    LayoutDashboard,
    Truck,
    Package,
    Users,
    MapPin,
    FileText,
    DollarSign,
    CreditCard,
    Receipt,
    BarChart3,
    MessageSquare,
    FolderOpen,
    Camera,
    Map,
    Search,
    Wrench,
    Link2,
    Fuel,
    FileSpreadsheet,
    Shield,
    CircleDollarSign,
    Store,
    UserCog,
    Settings,
    Radio,
    ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MainTMSLogo } from "@/components/MainTMSLogo";

const navGroups = [
    {
        label: "Overview",
        items: [
            { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
            { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
        ],
    },
    {
        label: "Operations",
        items: [
            { title: "Loads", url: "/admin/loads", icon: Package },
            { title: "Dispatch", url: "/admin/dispatch", icon: MapPin },
            { title: "Tracking", url: "/admin/tracking", icon: Map },
            { title: "Loadboards", url: "/admin/loadboards", icon: Search },
        ],
    },
    {
        label: "Fleet",
        items: [
            { title: "Drivers", url: "/admin/drivers", icon: Users },
            { title: "Equipment", url: "/admin/equipment", icon: Truck },
            { title: "Maintenance", url: "/admin/maintenance", icon: Wrench },
            { title: "Motive ELD", url: "/admin/motive", icon: Radio },
        ],
    },
    {
        label: "Financial",
        items: [
            { title: "Invoices", url: "/admin/invoices", icon: FileText },
            { title: "Expenses", url: "/admin/expenses", icon: Receipt },
            { title: "Payroll", url: "/admin/payroll", icon: DollarSign },
            { title: "Accounting", url: "/admin/accounting", icon: CreditCard },
            { title: "Fuel", url: "/admin/fuel", icon: Fuel },
            { title: "Tolls", url: "/admin/tolls", icon: CircleDollarSign },
            { title: "QuickBooks", url: "/admin/quickbooks", icon: Link2 },
        ],
    },
    {
        label: "Compliance",
        items: [
            { title: "Safety", url: "/admin/safety", icon: Shield },
            { title: "IFTA", url: "/admin/ifta", icon: FileSpreadsheet },
            { title: "Docs Exchange", url: "/admin/docs-exchange", icon: FolderOpen },
            { title: "POD History", url: "/admin/pod-history", icon: Camera },
        ],
    },
    {
        label: "Management",
        items: [
            { title: "Customers", url: "/admin/customers", icon: Store },
            { title: "Vendors", url: "/admin/vendors", icon: Store },
            { title: "Communications", url: "/admin/communications", icon: MessageSquare },
            { title: "Users", url: "/admin/users", icon: UserCog },
        ],
    },
    {
        label: "Settings", // Usually in footer, but keeping consistent structure
        items: [
            { title: "Settings", url: "/admin/settings", icon: Settings },
        ]
    }
];

export function AppSidebar() {
    const pathname = usePathname();
    const { state } = useSidebar();
    const collapsed = state === "collapsed";

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border h-screen sticky top-0">
            <SidebarHeader className="p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3 pl-1">
                    <Link href="/admin" className="block w-full">
                        {!collapsed ? <MainTMSLogo /> : <MainTMSLogo variant="ai-only" />}
                    </Link>
                </div>
            </SidebarHeader>

            <SidebarContent className="scrollbar-thin py-2">
                {navGroups.slice(0, -1).map((group) => {
                    // Check if any item in group is active to open accordion by default
                    const isGroupActive = group.items.some((item) => pathname === item.url);

                    return (
                        <Collapsible key={group.label} defaultOpen={true} className="group/collapsible">
                            <SidebarGroup>
                                <SidebarGroupLabel asChild>
                                    <CollapsibleTrigger className="w-full flex items-center justify-between text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider hover:text-sidebar-foreground transition-colors">
                                        {group.label}
                                        <ChevronDown className="ml-auto w-3 h-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </CollapsibleTrigger>
                                </SidebarGroupLabel>
                                <CollapsibleContent>
                                    <SidebarGroupContent>
                                        <SidebarMenu>
                                            {group.items.map((item) => (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={pathname === item.url}
                                                        tooltip={item.title}
                                                    >
                                                        <Link href={item.url} className="flex items-center gap-2">
                                                            <item.icon className="h-4 w-4" />
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                </CollapsibleContent>
                            </SidebarGroup>
                        </Collapsible>
                    );
                })}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === "/admin/settings"}>
                            <Link href="/admin/settings" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
