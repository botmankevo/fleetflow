"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../lib/api";

type Props = {
  from: string;
  to: string;
};

export default function MapPreview({ from, to }: Props) {
  const [data, setData] = useState<{ distance_text: string; duration_text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) return;
    (async () => {
      try {
        const token = getToken();
        const res = await apiFetch(`/maps/route?from_addr=${encodeURIComponent(from)}&to_addr=${encodeURIComponent(to)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setData(res);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load route"));
      }
    })();
  }, [from, to]);

  return (
    <div className="card">
      <div className="text-sm text-slate">Route</div>
      {error && <div className="text-xs text-red-400">{error}</div>}
      {data ? (
        <div className="mt-2 text-sm">
          <div>Distance: {data.distance_text}</div>
          <div>ETA: {data.duration_text}</div>
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate">Enter pickup/delivery to load route.</div>
      )}
    </div>
  );
}
