const myLoads = [
  { id: "COX-1001", pickup: "Houston, TX", delivery: "Dallas, TX", status: "Assigned" },
  { id: "COX-1003", pickup: "Austin, TX", delivery: "San Antonio, TX", status: "In Transit" }
];

export default function DriverLoadsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Loads</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {myLoads.map((load) => (
          <a
            key={load.id}
            href={`/driver/loads/${load.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{load.status}</p>
            <h3 className="mt-1 text-lg font-semibold">{load.id}</h3>
            <p className="mt-3 text-sm text-slate-600">
              {load.pickup} → {load.delivery}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
