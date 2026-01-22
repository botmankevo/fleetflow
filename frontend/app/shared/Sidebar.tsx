const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Loads", href: "/loads" },
  { label: "POD Submissions", href: "/loads/1" },
  { label: "Maintenance", href: "/maintenance" },
  { label: "Expenses", href: "/expenses" },
  { label: "Users", href: "/users" }
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-slate-200 bg-white p-6 lg:block">
      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {link.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
