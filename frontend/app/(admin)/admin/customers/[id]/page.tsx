"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

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

interface Load {
  id: number;
  load_number: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_date: string;
  delivery_date: string;
  broker_rate: number;
  driver_name?: string;
  created_at: string;
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "loads" | "activity">("overview");

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      // Load customer details
      const customerData = await apiFetch(`/customers/${customerId}`);
      setCustomer(customerData);

      // Load customer's loads
      const loadsData = await apiFetch(`/loads/?broker_id=${customerId}`);
      setLoads(Array.isArray(loadsData) ? loadsData : []);
    } catch (error) {
      console.error("Failed to load customer data:", error);
      alert("Failed to load customer profile");
      router.push("/admin/customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="p-8 bg-slate-50 min-h-screen">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer profile...</p>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="p-8 bg-slate-50 min-h-screen">
        <div className="text-center py-20">
          <p className="text-gray-600">Customer not found</p>
          <button
            onClick={() => router.push("/admin/customers")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Back to Customers
          </button>
        </div>
      </main>
    );
  }

  const typeColors: { [key: string]: string } = {
    broker: "bg-purple-100 text-purple-800",
    shipper: "bg-blue-100 text-blue-800",
    carrier: "bg-green-100 text-green-800",
  };

  return (
    <main className="p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/customers")}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {customer.company_name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${typeColors[customer.customer_type]}`}>
                {customer.customer_type.toUpperCase()}
              </span>
              {customer.is_active ? (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  ACTIVE
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                  INACTIVE
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/admin/customers?edit=${customerId}`)}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          Edit Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon="📦" label="Total Loads" value={customer.total_loads.toString()} color="blue" />
        <StatCard icon="💰" label="Total Revenue" value={`$${customer.total_revenue.toLocaleString()}`} color="green" />
        <StatCard icon="🚚" label="Active Loads" value={loads.filter(l => l.status !== 'completed').length.toString()} color="yellow" />
        <StatCard icon="✅" label="Completed" value={loads.filter(l => l.status === 'completed').length.toString()} color="purple" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-1">
            {[
              { id: "overview", label: "Overview", icon: "📋" },
              { id: "loads", label: "Loads History", icon: "🚛" },
              { id: "activity", label: "Activity", icon: "📊" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && <OverviewTab customer={customer} />}
          {activeTab === "loads" && <LoadsTab loads={loads} />}
          {activeTab === "activity" && <ActivityTab customer={customer} loads={loads} />}
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-semibold opacity-75">{label}</p>
    </div>
  );
}

function OverviewTab({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <InfoRow label="MC Number" value={customer.mc_number || "N/A"} />
          <InfoRow label="DOT Number" value={customer.dot_number || "N/A"} />
          <InfoRow label="Phone" value={customer.phone || "N/A"} />
          <InfoRow label="Email" value={customer.email || "N/A"} />
          <InfoRow label="Address" value={customer.address || "N/A"} className="col-span-2" />
          <InfoRow label="City" value={customer.city || "N/A"} />
          <InfoRow label="State" value={customer.state || "N/A"} />
        </div>
      </div>

      {/* Business Details */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <InfoRow label="Payment Terms" value={customer.payment_terms || "N/A"} />
          <InfoRow label="Credit Limit" value={customer.credit_limit ? `$${customer.credit_limit.toLocaleString()}` : "N/A"} />
          <InfoRow label="Default Rate" value={customer.default_rate ? `$${customer.default_rate}/mile` : "N/A"} />
          <InfoRow label="Member Since" value={new Date(customer.created_at).toLocaleDateString()} />
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-gray-700">{customer.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadsTab({ loads }: { loads: Load[] }) {
  if (loads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No loads yet</h3>
        <p className="text-gray-600">This customer doesn't have any loads assigned</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loads.map((load) => (
        <div key={load.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-gray-900">{load.load_number}</h4>
              <p className="text-sm text-gray-600">Driver: {load.driver_name || "Unassigned"}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              load.status === 'completed' ? 'bg-green-100 text-green-800' :
              load.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {load.status.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="text-sm font-semibold text-gray-900">{load.pickup_location}</p>
              <p className="text-xs text-gray-600">{new Date(load.pickup_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Delivery</p>
              <p className="text-sm font-semibold text-gray-900">{load.delivery_location}</p>
              <p className="text-xs text-gray-600">{new Date(load.delivery_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-lg font-bold text-green-600">${load.broker_rate.toLocaleString()}</span>
            <a href={`/admin/loads/${load.id}`} className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
              View Details →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTab({ customer, loads }: { customer: Customer; loads: Load[] }) {
  const avgRate = loads.length > 0 ? loads.reduce((sum, l) => sum + l.broker_rate, 0) / loads.length : 0;
  const recentLoads = loads.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-semibold mb-1">Average Load Rate</p>
            <p className="text-2xl font-bold text-blue-700">${avgRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-semibold mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-green-700">
              {loads.length > 0 ? Math.round((loads.filter(l => l.status === 'completed').length / loads.length) * 100) : 0}%
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 font-semibold mb-1">Active Loads</p>
            <p className="text-2xl font-bold text-purple-700">{loads.filter(l => l.status !== 'completed').length}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentLoads.map((load) => (
            <div key={load.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{load.load_number}</p>
                <p className="text-xs text-gray-600">{new Date(load.created_at).toLocaleString()}</p>
              </div>
              <span className="text-sm font-semibold text-green-600">${load.broker_rate.toLocaleString()}</span>
            </div>
          ))}
          {recentLoads.length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
