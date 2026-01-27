"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("dispatcher");
  const [carrierId, setCarrierId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, carrier_record_id: carrierId }),
      });
      setToken(res.access_token);
      if (role === "driver") router.push("/driver");
      else router.push("/admin");
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-xl text-gold">FleetFlow Login</h1>
        <input className="input w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="dispatcher">Dispatcher</option>
          <option value="driver">Driver</option>
        </select>
        <input className="input w-full" placeholder="Carrier Record ID (recXXXX)" value={carrierId} onChange={(e) => setCarrierId(e.target.value)} />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button className="btn w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
