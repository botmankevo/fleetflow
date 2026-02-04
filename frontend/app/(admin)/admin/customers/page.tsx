"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import BrokerVerification from "@/components/maps/BrokerVerification";

interface Customer {
  id: number;
  company_name: string;
  mc_number?: string;
  dot_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  payment_terms?: string;
  credit_limit?: number;
  default_rate?: number;
  notes?: string;
  customer_type: string;
  is_active: boolean;
  total_loads: number;
  total_revenue: number;
  created_at: string;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await apiFetch("/customers/");
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm("Are you sure you want to deactivate this customer?")) return;

    try {
      await apiFetch(`/customers/${customerId}`, { method: "DELETE" });
      await loadCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || customer.customer_type === filterType;

    return matchesSearch && matchesType && customer.is_active;
  });

  if (loading) {
    return (
      <main className="p-8 bg-slate-50 min-h-screen">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-slate-500 mt-1">
            Manage broker relationships and direct shippers
          </p>
        </div>
        <button
          onClick={handleAddCustomer}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all"
        >
          + Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={customers.filter((c) => c.is_active).length}
          icon="🏢"
          color="blue"
        />
        <StatCard
          label="Total Loads"
          value={customers.reduce((sum, c) => sum + c.total_loads, 0)}
          icon="📦"
          color="green"
        />
        <StatCard
          label="Total Revenue"
          value={`$${customers.reduce((sum, c) => sum + c.total_revenue, 0).toLocaleString()}`}
          icon="💰"
          color="yellow"
        />
        <StatCard
          label="Active Brokers"
          value={
            customers.filter((c) => c.customer_type === "broker" && c.is_active)
              .length
          }
          icon="🤝"
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, MC#, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            {["all", "broker", "shipper", "carrier"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  filterType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No customers found
            </h3>
            <p className="text-gray-600">
              Add your first customer to get started
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
            />
          ))
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowModal(false);
            setSelectedCustomer(null);
          }}
          onSave={async () => {
            await loadCustomers();
            setShowModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </main>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div
      className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-semibold opacity-75">{label}</p>
    </div>
  );
}

// Customer Card Component
function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
}) {
  const typeColors: { [key: string]: string } = {
    broker: "bg-purple-100 text-purple-800",
    shipper: "bg-blue-100 text-blue-800",
    carrier: "bg-green-100 text-green-800",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {customer.company_name}
          </h3>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
              typeColors[customer.customer_type]
            }`}
          >
            {customer.customer_type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {customer.mc_number && (
          <p>
            <span className="font-semibold">MC#:</span> {customer.mc_number}
          </p>
        )}
        {customer.city && customer.state && (
          <p>
            <span className="font-semibold">Location:</span> {customer.city},{" "}
            {customer.state}
          </p>
        )}
        {customer.phone && (
          <p>
            <span className="font-semibold">Phone:</span> {customer.phone}
          </p>
        )}
        {customer.payment_terms && (
          <p>
            <span className="font-semibold">Terms:</span>{" "}
            {customer.payment_terms}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Total Loads</p>
          <p className="text-lg font-bold text-gray-900">
            {customer.total_loads}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-lg font-bold text-green-600">
            ${customer.total_revenue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(customer)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(customer.id)}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
        >
          Delete
        </button>
        <a
          href={`/admin/customers/${customer.id}`}
          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
        >
          View
        </a>
      </div>
    </div>
  );
}

// Customer Modal Component
function CustomerModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    company_name: customer?.company_name || "",
    mc_number: customer?.mc_number || "",
    dot_number: customer?.dot_number || "",
    address: customer?.address || "",
    city: customer?.city || "",
    state: customer?.state || "",
    zip_code: customer?.zip_code || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    payment_terms: customer?.payment_terms || "Net 30",
    credit_limit: customer?.credit_limit || 0,
    default_rate: customer?.default_rate || 0,
    notes: customer?.notes || "",
    customer_type: customer?.customer_type || "broker",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (customer) {
        // Update existing
        await apiFetch(`/customers/${customer.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        // Create new
        await apiFetch("/customers/", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      onSave();
    } catch (error) {
      console.error("Failed to save customer:", error);
      alert("Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {customer ? "Edit Customer" : "Add New Customer"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                MC Number
              </label>
              <input
                type="text"
                value={formData.mc_number}
                onChange={(e) =>
                  setFormData({ ...formData, mc_number: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                DOT Number
              </label>
              <input
                type="text"
                value={formData.dot_number}
                onChange={(e) =>
                  setFormData({ ...formData, dot_number: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Customer Type
              </label>
              <select
                value={formData.customer_type}
                onChange={(e) =>
                  setFormData({ ...formData, customer_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="broker">Broker</option>
                <option value="shipper">Shipper</option>
                <option value="carrier">Carrier</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                value={formData.payment_terms}
                onChange={(e) =>
                  setFormData({ ...formData, payment_terms: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Quick Pay">Quick Pay</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Broker Verification */}
          {formData.mc_number && (
            <div className="mt-4">
              <BrokerVerification
                mcNumber={formData.mc_number}
                onVerified={(data) => {
                  // Auto-fill data from FMCSA
                  setFormData({
                    ...formData,
                    company_name: data.legal_name || formData.company_name,
                    dot_number: data.dot_number || formData.dot_number,
                    address:
                      data.physical_address?.street || formData.address,
                    city: data.physical_address?.city || formData.city,
                    state: data.physical_address?.state || formData.state,
                    phone: data.phone || formData.phone,
                  });
                }}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : customer ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
