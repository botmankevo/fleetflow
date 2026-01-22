import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

const defaultForm = {
  email: "",
  role: "Dispatcher",
  carrier_id: ""
};

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [token, setToken] = useState(() => localStorage.getItem("fleetflow_token") || "");
  const [authPayload, setAuthPayload] = useState(null);
  const [loads, setLoads] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/dev-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      const data = await response.json();
      localStorage.setItem("fleetflow_token", data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fleetflow_token");
    setToken("");
    setAuthPayload(null);
    setLoads(null);
  };

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setError("");
      try {
        const [meRes, loadsRes] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, { headers }),
          fetch(`${API_BASE}/loads?view=All%20Loads&max_records=50`, { headers })
        ]);
        if (!meRes.ok) {
          throw new Error("Failed to fetch /auth/me");
        }
        if (!loadsRes.ok) {
          throw new Error("Failed to fetch /loads");
        }
        const meData = await meRes.json();
        const loadsData = await loadsRes.json();
        setAuthPayload(meData);
        setLoads(loadsData);
      } catch (err) {
        setError(err.message || "Unable to load data");
      }
    };

    fetchData();
  }, [token, headers]);

  return (
    <div className="app">
      <h1>FleetFlow Dispatch Portal</h1>

      {!token ? (
        <form onSubmit={handleLogin}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="Admin">Admin</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Driver">Driver</option>
            </select>
          </label>

          <label>
            Carrier ID
            <input
              type="text"
              name="carrier_id"
              value={form.carrier_id}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Dev Login"}
          </button>
        </form>
      ) : (
        <div>
          <p>Logged in.</p>
          <div className="token">JWT: {token}</div>
          <button type="button" onClick={handleLogout} style={{ marginTop: 12 }}>
            Logout
          </button>
        </div>
      )}

      {error && (
        <div className="section">
          <strong>Error:</strong> {error}
        </div>
      )}

      {token && (
        <div className="section">
          <h2>Auth Payload</h2>
          <pre>{authPayload ? JSON.stringify(authPayload, null, 2) : "Loading..."}</pre>

          <h2>Loads</h2>
          <pre>{loads ? JSON.stringify(loads, null, 2) : "Loading..."}</pre>
        </div>
      )}
    </div>
  );
}
