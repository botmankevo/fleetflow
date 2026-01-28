"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type User = {
  id: number;
  email: string;
  role: string;
  driver_id?: number | null;
  is_active: boolean;
};

type Driver = {
  id: number;
  name: string;
  email?: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "driver",
    driverId: "",
    active: true,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const token = getToken();
      const [u, d] = await Promise.all([
        apiFetch("/users", { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
        apiFetch("/drivers", { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
      ]);
      setUsers(u);
      setDrivers(d);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load users"));
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch("/users", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
          driver_id: form.driverId ? Number(form.driverId) : null,
          is_active: form.active,
        }),
      });
      setForm({ email: "", password: "", role: "driver", driverId: "", active: true });
      await fetchAll();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create user"));
    } finally {
      setCreating(false);
    }
  }

  async function saveUser(user: User) {
    try {
      setSavingId(user.id);
      const token = getToken();
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: user.role,
          driver_id: user.driver_id ?? null,
          is_active: user.is_active,
        }),
      });
      await fetchAll();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update user"));
    } finally {
      setSavingId(null);
    }
  }

  async function resetPassword(userId: number, newPassword: string) {
    try {
      setResetId(userId);
      const token = getToken();
      await apiFetch(`/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setResetId(null);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">Users</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Create User</h2>
        <form onSubmit={createUser} className="grid gap-3">
          <input
            className="input w-full"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="input w-full"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <select
            className="input w-full"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="admin">admin</option>
            <option value="dispatcher">dispatcher</option>
            <option value="driver">driver</option>
          </select>
          <select
            className="input w-full"
            value={form.driverId}
            onChange={(e) => setForm({ ...form, driverId: e.target.value })}
          >
            <option value="">Link Driver (optional)</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.email ? ` (${d.email})` : ""}
              </option>
            ))}
          </select>
          <label className="text-xs text-slate flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
          <button className="btn" disabled={creating}>
            {creating ? "Creating..." : "Create User"}
          </button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">All Users</h2>
        {users.length === 0 && <div className="text-xs text-slate">No users yet.</div>}
        {users.map((user) => (
          <div key={user.id} className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="text-sm text-gold">{user.email}</div>
            <div className="grid gap-2 md:grid-cols-3">
              <select
                className="input w-full"
                value={user.role}
                onChange={(e) =>
                  setUsers((prev) =>
                    prev.map((u) => (u.id === user.id ? { ...u, role: e.target.value } : u))
                  )
                }
              >
                <option value="admin">admin</option>
                <option value="dispatcher">dispatcher</option>
                <option value="driver">driver</option>
              </select>
              <select
                className="input w-full"
                value={user.driver_id ?? ""}
                onChange={(e) =>
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === user.id ? { ...u, driver_id: e.target.value ? Number(e.target.value) : null } : u
                    )
                  )
                }
              >
                <option value="">Link Driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.email ? ` (${d.email})` : ""}
                  </option>
                ))}
              </select>
              <label className="text-xs text-slate flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={user.is_active}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) => (u.id === user.id ? { ...u, is_active: e.target.checked } : u))
                    )
                  }
                />
                Active
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => saveUser(user)} disabled={savingId === user.id}>
                {savingId === user.id ? "Saving..." : "Save"}
              </button>
              <button
                className="btn"
                onClick={() => {
                  const newPassword = prompt("New password:");
                  if (newPassword) resetPassword(user.id, newPassword);
                }}
                disabled={resetId === user.id}
              >
                {resetId === user.id ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
