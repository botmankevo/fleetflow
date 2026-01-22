export default function LoadDetailPage() {
  const pickup = "123 Farm Rd, Houston, TX";
  const delivery = "987 Market St, Dallas, TX";
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(delivery)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Load COX-1001</h2>
          <p className="text-sm text-slate-500">Assigned • Delivery 2024-11-01</p>
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Assign Driver</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold">Route</h3>
          <p className="mt-1 text-xs text-slate-500">Truck route best effort; verify restrictions.</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <iframe
              className="h-64 w-full"
              loading="lazy"
              src={`https://www.google.com/maps/embed/v1/directions?key=GOOGLE_MAPS_API_KEY&origin=${encodeURIComponent(
                pickup
              )}&destination=${encodeURIComponent(delivery)}`}
            />
          </div>
          <a className="mt-3 inline-flex text-sm font-medium text-slate-900" href={mapsUrl}>
            Open in Google Maps
          </a>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Load Details</h3>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <div>
              <p className="text-xs text-slate-400">Pickup</p>
              <p>Fresh Farms</p>
              <p>{pickup}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Delivery</p>
              <p>Market Hub</p>
              <p>{delivery}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Broker</p>
              <p>Example Broker</p>
              <p>(555) 111-2222</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">POD Submissions</h3>
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
            View POD Packet
          </button>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          <p>Submitted: 2024-10-02 14:32</p>
          <p>Signed BOL: 1 file • Delivery Photos: 6 files</p>
        </div>
      </section>
    </div>
  );
}
