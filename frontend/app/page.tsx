export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          FleetFlow portal
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Dispatch, POD, and compliance workflows built for Cox Transportation &amp; Logistics.
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          This tenant-aware workspace is ready to connect drivers, dispatchers, and back office
          staff with real-time load tracking and proof-of-delivery submissions.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: 'Driver POD Submissions',
            description:
              'Upload BOL/POD, delivery photos, and receiver signature in a mobile-first form.',
          },
          {
            title: 'Load Visibility',
            description:
              'Track status, broker details, pickup/delivery locations, and POD timestamps.',
          },
          {
            title: 'Compliance & Maintenance',
            description:
              'Monitor expiration dates, renewal workflows, and vehicle maintenance logs.',
          },
          {
            title: 'Multi-tenant Security',
            description:
              'Role-based access with strict tenant isolation built in from day one.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40"
          >
            <h2 className="text-lg font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm text-emerald-100">
        Next up: connect the POD workflow UI, Dropbox integrations, and PDF previews.
      </section>
    </main>
  );
}
