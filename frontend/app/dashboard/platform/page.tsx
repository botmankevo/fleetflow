"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, getToken, getUserFromToken } from "@/src/lib/api";

type Tenant = {
  id: number;
  slug: string;
  name: string;
  company_name: string;
};

export default function PlatformPage() {
  const token = useMemo(() => getToken(), []);
  const role = getUserFromToken()?.role;
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [tenantForm, setTenantForm] = useState({
    slug: "",
    name: "",
    company_name: "",
    mc_number: "",
    dot_number: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  const [inviteTenantId, setInviteTenantId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");

  async function fetchTenants() {
    if (!token) return;
    try {
      const data = await apiFetch("/platform/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load tenants");
    }
  }

  useEffect(() => {
    fetchTenants();
  }, []);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/platform/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(tenantForm),
      });
      setMessage("Tenant created.");
      setTenantForm({
        slug: "",
        name: "",
        company_name: "",
        mc_number: "",
        dot_number: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
      });
      await fetchTenants();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create tenant");
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !inviteTenantId) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/platform/tenants/${inviteTenantId}/invites`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      setMessage("Invite sent.");
      setInviteEmail("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send invite");
    }
  }

  if (role && role !== "platform_owner") {
    return (
      <main style={{ padding: 24 }}>
        <p>Access denied.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Platform Admin</h1>

      {message && <div style={{ color: "green" }}>{message}</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Create Tenant</h2>
        <form onSubmit={createTenant} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Slug" value={tenantForm.slug} onChange={(e) => setTenantForm({ ...tenantForm, slug: e.target.value })} />
          <input placeholder="Name" value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} />
          <input placeholder="Company Name" value={tenantForm.company_name} onChange={(e) => setTenantForm({ ...tenantForm, company_name: e.target.value })} />
          <input placeholder="MC Number" value={tenantForm.mc_number} onChange={(e) => setTenantForm({ ...tenantForm, mc_number: e.target.value })} />
          <input placeholder="DOT Number" value={tenantForm.dot_number} onChange={(e) => setTenantForm({ ...tenantForm, dot_number: e.target.value })} />
          <input placeholder="Email" value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} />
          <input placeholder="Phone" value={tenantForm.phone} onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })} />
          <input placeholder="Address" value={tenantForm.address} onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input placeholder="City" value={tenantForm.city} onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })} />
            <input placeholder="State" value={tenantForm.state} onChange={(e) => setTenantForm({ ...tenantForm, state: e.target.value })} />
            <input placeholder="Zip" value={tenantForm.zip_code} onChange={(e) => setTenantForm({ ...tenantForm, zip_code: e.target.value })} />
          </div>
          <button type="submit">Create Tenant</button>
        </form>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Invite Tenant Admin</h2>
        <form onSubmit={sendInvite} style={{ display: "grid", gap: 10 }}>
          <select value={inviteTenantId} onChange={(e) => setInviteTenantId(e.target.value)} required>
            <option value="">Select tenant...</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.slug})
              </option>
            ))}
          </select>
          <input placeholder="Invitee Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
          <button type="submit">Send Invite</button>
        </form>
      </section>
    </main>
  );
}
