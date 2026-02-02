"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has dismissed before
            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", "true");
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
            <GlassCard className="p-4 border-primary/20 shadow-xl" gradient>
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 mt-0.5">
                        <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-foreground mb-1">Install FleetFlow</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Add to your home screen for quick access and offline capabilities
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDismiss}
                        className="flex-1 rounded-xl text-xs"
                    >
                        Not now
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleInstall}
                        className="flex-1 rounded-xl bg-primary text-xs font-bold"
                    >
                        Install App
                    </Button>
                </div>
            </GlassCard>
        </div>
    );
}
