const loads = [
  {
    id: "COX-1001",
    status: "Assigned",
    pickup: "Fresh Farms - Houston, TX",
    delivery: "Market Hub - Dallas, TX",
    driver: "Alicia Driver"
  },
  {
    id: "COX-1002",
    status: "In Transit",
    pickup: "Gulf Ports - Houston, TX",
    delivery: "Retail DC - Austin, TX",
    driver: "Marco Driver"
  }
];

export default function LoadsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Loads</h2>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">New Load</button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Load</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pickup</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loads.map((load) => (
              <tr key={load.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium text-slate-900">{load.id}</td>
                <td className="px-4 py-3 text-slate-600">{load.status}</td>
                <td className="px-4 py-3 text-slate-600">{load.pickup}</td>
                <td className="px-4 py-3 text-slate-600">{load.delivery}</td>
                <td className="px-4 py-3 text-slate-600">{load.driver}</td>
                <td className="px-4 py-3">
                  <a className="text-slate-900 hover:underline" href="/loads/1">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
