"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ThemeToggle"; // Using existing theme toggle

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
                <AppSidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-slate-900 px-6 shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search loads, drivers, customers..."
                                    className="w-80 pl-9 h-10 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />

                            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-full">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                            </Button>

                            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                            <div className="flex items-center gap-3 pl-1">
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin User</p>
                                    <p className="text-xs text-slate-500 font-medium">Fleet Manager</p>
                                </div>
                                <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-800 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-xs">AD</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-auto p-6 scrollbar-hide">
                        <div className="max-w-7xl mx-auto w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
