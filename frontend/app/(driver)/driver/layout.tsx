import Link from "next/link";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="px-6 py-4 border-b border-white/10 flex gap-4 text-sm">
        <Link className="link" href="/driver">Driver</Link>
        <Link className="link" href="/driver/loads">Loads</Link>
        <Link className="link" href="/driver/pod">POD</Link>
        <Link className="link" href="/admin">Admin View</Link>
      </nav>
      {children}
    </div>
  );
}
