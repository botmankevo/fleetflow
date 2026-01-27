"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, clearToken, getToken, getUserFromToken } from "@/src/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const user = getUserFromToken();
  const role = user?.role;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        // tenant/profile requires a tenant-scoped token (admin@coxtnl.com)
        const data = await apiFetch("/tenant/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile");
      }
    })();
  }, [router]);

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          {(role === "tenant_admin" || role === "dispatcher" || role === "platform_owner") && (
            <Link href="/dashboard/loads">Loads</Link>
          )}
          {(role === "driver" || role === "tenant_admin" || role === "dispatcher" || role === "platform_owner") && (
            <Link href="/dashboard/pod">POD Submit</Link>
          )}
          {(role === "tenant_admin" || role === "dispatcher" || role === "platform_owner") && (
            <Link href="/dashboard/drivers">Drivers</Link>
          )}
          {role === "platform_owner" && <Link href="/dashboard/platform">Platform</Link>}
        </div>
        <button
          onClick={() => {
            clearToken();
            router.push("/login");
          }}
        >
          Log out
        </button>
      </header>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <section style={{ marginTop: 16 }}>
        <h2>Tenant Profile</h2>
        <pre style={{ padding: 12, background: "#0b1020", color: "#e5e7eb", borderRadius: 10, overflow: "auto" }}>
          {profile ? JSON.stringify(profile, null, 2) : "Loading..."}
        </pre>
      </section>
    </main>
  );
}
