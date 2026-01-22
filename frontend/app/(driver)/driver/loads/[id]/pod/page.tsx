export default function PodFormPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Submit POD</h2>
        <p className="text-sm text-slate-500">Load COX-1001 • Delivery 2024-11-01</p>
      </div>

      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium text-slate-700">Receiver Name</label>
          <input className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Delivery Date</label>
          <input type="date" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Typed Signature</label>
          <input className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" placeholder="Type full name" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <textarea className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2" rows={3} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Signed BOL (required)</label>
          <input type="file" accept="image/*,.pdf" multiple className="mt-1 w-full" capture="environment" />
          <p className="mt-1 text-xs text-slate-500">Tip: On iPhone choose “Scan Documents” when uploading.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Delivery Photos (0-10)</label>
          <input type="file" accept="image/*" multiple className="mt-1 w-full" capture="environment" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" />
          <span className="text-sm text-slate-600">Send receiver copy</span>
        </div>
        <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Submit POD
        </button>
      </form>
    </div>
  );
}
