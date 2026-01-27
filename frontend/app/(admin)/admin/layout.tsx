"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "../../../lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

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
        setRole(me?.role ?? null);
        if (me?.role !== "admin" && me?.role !== "dispatcher") {
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
      <div className="p-6 text-slate">Checking access…</div>
    );
  }

  return (
    <div>
      <nav className="px-6 py-4 border-b border-white/10 flex gap-4 text-sm">
        <Link className="link" href="/admin">Admin</Link>
        <Link className="link" href="/admin/loads">Loads</Link>
        {role === "admin" || role === "dispatcher" ? (
          <Link className="link" href="/driver">Driver View</Link>
        ) : null}
      </nav>
      {children}
    </div>
  );
}
