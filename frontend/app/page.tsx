export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Welcome to FleetFlow</h2>
        <p className="mt-2 text-sm text-slate-600">
          Internal-only dispatch portal for Carrier Outgoing Xpress LLC dba Cox Transportation & Logistics.
        </p>
        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <p>MC 1514835 | DOT 4018154</p>
          <p>Houston, TX</p>
        </div>
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
          Tip: When uploading documents on iPhone, choose “Scan Documents” for clean POD scans.
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Sign in</h2>
        <form className="mt-4 space-y-4">
          <input className="w-full rounded-md border border-slate-200 px-3 py-2" placeholder="Email" />
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2"
            placeholder="Password"
            type="password"
          />
          <button className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Continue
          </button>
        </form>
      </section>
    </div>
  );
}
