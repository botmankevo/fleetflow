"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, getToken } from "../../../lib/api";
import { AppLayout } from "../../../components/layout/AppLayout";
import AICopilot from "../../../components/AICopilot";
import AICommandPalette from "../../../components/AICommandPalette";
import { PWAInstallPrompt } from "../../../components/pwa-install-prompt";
import { WebSocketProvider } from "../../../lib/websocket-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const me = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Allow admin, dispatcher, and platform_owner roles
        if (me?.role === "driver") {
          router.replace("/driver");
          return;
        }
        setReady(true);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="font-medium">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <WebSocketProvider enabled={false}>
      <AppLayout>
        {children}
        <AICopilot />
        <AICommandPalette />
        <PWAInstallPrompt />
      </AppLayout>
    </WebSocketProvider>
  );
}
