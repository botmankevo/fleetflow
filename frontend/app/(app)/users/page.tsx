const users = [
  { name: "Admin", role: "admin", email: "admin@coxtnl.com" },
  { name: "Dispatcher", role: "dispatcher", email: "dispatch@coxtnl.com" },
  { name: "Driver", role: "driver", email: "driver@coxtnl.com" }
];

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add User</button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-200">
          {users.map((user) => (
            <li key={user.email} className="px-6 py-4">
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email} • {user.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
