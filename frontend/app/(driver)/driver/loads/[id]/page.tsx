export default function DriverLoadDetailPage() {
  const pickup = "123 Farm Rd, Houston, TX";
  const delivery = "987 Market St, Dallas, TX";
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(delivery)}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Load COX-1001</h2>
        <p className="text-sm text-slate-500">Assigned to you</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Pickup & Delivery</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">Pickup</p>
            <p className="font-medium">Fresh Farms</p>
            <p className="text-sm text-slate-600">{pickup}</p>
            <a className="mt-2 inline-flex text-sm font-medium text-slate-900" href="tel:8328402760">
              Call Pickup
            </a>
          </div>
          <div>
            <p className="text-xs text-slate-400">Delivery</p>
            <p className="font-medium">Market Hub</p>
            <p className="text-sm text-slate-600">{delivery}</p>
            <a className="mt-2 inline-flex text-sm font-medium text-slate-900" href="tel:8328402760">
              Call Delivery
            </a>
          </div>
        </div>
        <a className="mt-4 inline-flex text-sm font-medium text-slate-900" href={mapsUrl}>
          Open in Google Maps
        </a>
        <p className="mt-2 text-xs text-slate-500">Truck route best effort; verify restrictions.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Submit POD</h3>
        <p className="mt-1 text-sm text-slate-500">Upload signed BOL and delivery photos after delivery.</p>
        <a
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          href="/driver/loads/COX-1001/pod"
        >
          Go to POD Form
        </a>
      </section>
    </div>
  );
}
