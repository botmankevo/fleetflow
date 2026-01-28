"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UploadField from "../../../../components/UploadField";
import SignaturePad from "../../../../components/SignaturePad";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

export default function PodPage() {
  const [loadId, setLoadId] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
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
        setReady(true);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  async function submit() {
    setError(null);
    setMessage(null);
    const token = getToken();
    if (!token) return;
    if (!loadId || !files) {
      setError("Load ID and files are required.");
      return;
    }
    const form = new FormData();
    form.append("load_id", loadId);
    Array.from(files).forEach((f) => form.append("files", f));
    if (signature) {
      const blob = await (await fetch(signature)).blob();
      form.append("signature", new File([blob], "signature.png", { type: "image/png" }));
    }

    try {
      const res = await apiFetch("/pod/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      setMessage(`Uploaded. Links: ${res.links?.length || 0}`);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
    }
  }

  if (!ready) {
    return <main className="p-6 text-slate">Checking access…</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl text-gold">POD Upload</h1>
      <div className="card space-y-4">
        <input className="input w-full" type="number" placeholder="Load ID (numeric)" value={loadId} onChange={(e) => setLoadId(e.target.value)} />
        <UploadField label="POD Files" multiple onChange={setFiles} />
        <SignaturePad onChange={setSignature} />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {message && <div className="text-green-400 text-sm">{message}</div>}
        <button className="btn" onClick={submit}>Submit POD</button>
      </div>
    </main>
  );
}
