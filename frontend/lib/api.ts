export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("fleetflow_token", token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fleetflow_token");
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}
