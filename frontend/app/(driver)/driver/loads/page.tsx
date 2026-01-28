"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";
import MapPreview from "../../../../components/MapPreview";

type Load = {
  id: number;
  load_number?: string | null;
  pickup_address: string;
  delivery_address: string;
};

type Driver = {
  id: number;
  name: string;
};

export default function DriverLoads() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [driverName, setDriverName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const me = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (me?.role !== "driver" && me?.role !== "admin" && me?.role !== "dispatcher") {
          router.replace("/login");
          return;
        }
        if (me?.driver_id) {
          const drivers = (await apiFetch("/drivers", {
            headers: { Authorization: `Bearer ${token}` },
          })) as Driver[];
          const match = drivers.find((d) => d.id === me.driver_id);
          if (match?.name) setDriverName(match.name);
        }
        const res = await apiFetch("/loads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoads(res);
        setReady(true);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load"));
      }
    })();
  }, [router]);

  if (!ready) {
    return <main className="p-6 text-slate">Checking access…</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">My Loads</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {loads.map((l) => (
        <div key={l.id} className="card space-y-3">
          <div className="text-gold">{l.load_number || l.id}</div>
          <div className="text-xs text-slate">{l.pickup_address} → {l.delivery_address}</div>
          <div className="text-xs text-slate">Driver: {driverName || "You"}</div>
          <MapPreview from={l.pickup_address || ""} to={l.delivery_address || ""} />
        </div>
      ))}
    </main>
  );
}
