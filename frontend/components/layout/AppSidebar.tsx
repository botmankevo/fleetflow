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
import { cn } from "@/lib/utils";
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
            { title: "Profit & Loss", url: "/admin/financials/profit-loss", icon: BarChart3 },
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
            { title: "POD History", url: "/admin/pod", icon: Camera },
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
];

export function AppSidebar() {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="p-4 border-b border-sidebar-border flex justify-center items-center h-14">
                {collapsed ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <Truck className="h-4 w-4 text-white" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full px-2">
                        <MainTMSLogo width={140} height={45} />
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent className="scrollbar-thin scroll-smooth pt-4 overflow-y-auto">
                {navGroups.map((group) => {
                    const isGroupActive = group.items.some((item) => pathname === item.url || pathname.startsWith(item.url + '/'));
                    return (
                        <Collapsible key={group.label} defaultOpen={true}>
                            <SidebarGroup>
                                <CollapsibleTrigger className="w-full">
                                    <SidebarGroupLabel className="flex items-center justify-between px-3 text-[10px] uppercase tracking-wider text-sidebar-muted font-semibold group-data-[state=collapsed]:hidden">
                                        {!collapsed && group.label}
                                        {!collapsed && <ChevronDown className="h-3 w-3" />}
                                    </SidebarGroupLabel>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarGroupContent>
                                        <SidebarMenu className="gap-1 mt-1">
                                            {group.items.map((item) => {
                                                const isActive = pathname === item.url || (item.url !== '/admin' && pathname.startsWith(item.url));
                                                return (
                                                    <SidebarMenuItem key={item.title}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={isActive}
                                                            tooltip={item.title}
                                                            className={cn(
                                                                "transition-colors",
                                                                isActive ? "bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                            )}
                                                        >
                                                            <Link href={item.url} className="flex items-center gap-3">
                                                                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-blue-600 dark:text-blue-400")} />
                                                                <span className="truncate">{item.title}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                );
                                            })}
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
                        <SidebarMenuButton asChild tooltip="Settings">
                            <Link
                                href="/admin/settings"
                                className={cn(
                                    "flex items-center gap-3",
                                    pathname === "/admin/settings"
                                        ? "bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 font-medium"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                            >
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
