export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("fleetflow_token", token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fleetflow_token");
}

/**
 * Decode JWT token to get user information
 * Returns null if token is invalid or doesn't exist
 */
export function decodeToken(): { user_id?: number; driver_id?: number; role?: string; carrier_id?: number } | null {
  const token = getToken();
  if (!token) return null;
  
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);
    
    return {
      user_id: parsed.user_id || parsed.sub,
      driver_id: parsed.driver_id,
      role: parsed.role,
      carrier_id: parsed.carrier_id
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Get the current driver ID from the JWT token
 * Returns null if not a driver or token is invalid
 */
export function getDriverId(): number | null {
  const decoded = decodeToken();
  return decoded?.driver_id || null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  
  // Get token and add Authorization header
  const token = getToken();
  const headers = new Headers(init.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Set Content-Type for JSON requests
  if (init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  
  const res = await fetch(url, {
    ...init,
    headers,
  });
  
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

export function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  return fallback;
}
