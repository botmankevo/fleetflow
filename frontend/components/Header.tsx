"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "../lib/api";
import { Search, Bell, Command, User, LogOut, ChevronDown, Settings } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Header() {
    const [user, setUser] = useState<{ email: string; role: string } | null>(null);

    useEffect(() => {
        (async () => {
            const token = getToken();
            if (token) {
                try {
                    const me = await apiFetch("/auth/me", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setUser(me);
                } catch { }
            }
        })();
    }, []);

    return (
        <header className="h-20 bg-white border-b border-gray-200 sticky top-0 right-0 left-0 lg:left-64 z-40 flex items-center justify-between px-6 lg:px-8 shadow-sm">
            <div className="flex-1 max-w-md ml-12 lg:ml-0">
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <span className="text-[10px] font-bold text-primary ai-text opacity-0 group-focus-within:opacity-100 transition-opacity">AI</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Ask AI or search operations..."
                        className="w-full h-11 pl-10 pr-12 rounded-xl bg-secondary/50 border border-glass-border focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm placeholder:text-muted-foreground"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 opacity-60 group-focus-within:opacity-0 transition-opacity">
                        <Command className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary">K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                <button className="relative p-2.5 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground active:scale-95 group">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-background group-hover:animate-bounce pulse-glow-accent"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-glass-border/50">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-secondary/50 p-1.5 px-2 rounded-xl transition-all outline-none">
                            <Avatar className="w-8 h-8 rounded-lg border border-glass-border shadow-sm">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {user?.email?.[0].toUpperCase() || "A"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left hidden md:block">
                                <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
                                    {user?.email || "User"}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-primary/5 text-primary border-primary/10">
                                        {user?.role || "Admin"}
                                    </Badge>
                                    <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mt-2" align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 py-2.5">
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 py-2.5">
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <LogOut className="w-4 h-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
