"use client";

import { useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

export default function AdminAccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const token = getToken();
      await apiFetch("/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update password"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">Account</h1>
      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Change Password</h2>
        <form onSubmit={changePassword} className="grid gap-3">
          <input
            className="input w-full"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            className="input w-full"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {message && <div className="text-green-400 text-sm">{message}</div>}
          <button className="btn" disabled={saving}>
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
