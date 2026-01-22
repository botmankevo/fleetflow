const cards = [
  { label: "Assigned Loads", value: 4 },
  { label: "In Transit", value: 2 },
  { label: "Completed", value: 18 }
];

const activity = [
  { id: "COX-1001", event: "Load assigned to Driver A", time: "Today 8:04 AM" },
  { id: "COX-1000", event: "POD submitted", time: "Yesterday 6:12 PM" }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Active Loads</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.id}</p>
                  <p className="text-slate-500">{item.event}</p>
                </div>
                <span className="text-xs text-slate-400">{item.time}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <button className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
              Create Load
            </button>
            <button className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
              Assign Driver
            </button>
            <button className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
              View POD Reports
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
