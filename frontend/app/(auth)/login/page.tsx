"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getErrorMessage, setToken } from "../../../lib/api";
import { MainTMSLogo } from "@/components/MainTMSLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No-op for now; keep effect hook in case we add auto-fill later.
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setToken(res.access_token);
      const me = await apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${res.access_token}` },
      });
      if (me?.role === "driver") router.push("/driver");
      else router.push("/admin");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Visual Side */}
      <div className="hidden lg:flex bg-primary relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="relative z-10">
          <div className="bg-white/90 p-3 rounded-2xl shadow-xl w-fit mb-8">
            <MainTMSLogo width={160} height={55} />
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Streamline your <br />
            fleet operations <br />
            with <span className="text-white/90">MainTMS</span>
          </h1>
        </div>

        <div className="relative z-10">
          <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-lg border border-white/20">
            <p className="text-lg font-medium italic">"MainTMS has transformed how we manage our shipments and drivers. It's clean, fast, and reliable."</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full"></div>
              <div>
                <p className="text-sm font-bold">James Miller</p>
                <p className="text-xs text-white/60">Operations Director, Global Logistics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 bg-gray-50 lg:bg-white dark:bg-gray-900 dark:lg:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <MainTMSLogo width={120} height={40} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Log in to your operations portal to manage your fleet.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 ml-1">Email Address</label>
              <input
                className="input w-full"
                placeholder="e.g. admin@maintms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Password</label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <input
                className="input w-full"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-head-shake">
                <span>⚠️</span> {error}
              </div>
            )}

            <button className="btn w-full py-4 text-lg" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in to Dashboard"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {"Don't have an account?"} <Link href="#" className="text-primary font-bold hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
