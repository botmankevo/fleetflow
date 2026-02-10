"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_terms: string;
  line_items: any[];
}

interface Customer {
  id: number;
  company_name: string;
}

interface Load {
  id: number;
  load_number: string;
  rate_amount: number;
  pickup_address: string;
  delivery_address: string;
}

export default function AccountingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, statsData, customersData, loadsData] = await Promise.all([
        apiFetch("/invoices/"),
        apiFetch("/invoices/stats/summary"),
        apiFetch("/customers/"),
        apiFetch("/loads/"),
      ]);

      setInvoices(invoicesData);
      setStats(statsData);
      setCustomers(customersData);
      setLoads(loadsData.filter((l: any) => l.status === "Delivered" && !l.invoiced));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus === "all") return true;
    return inv.status === filterStatus;
  });

  if (loading) {
    return (
      <main className="p-8 bg-background min-h-screen">
        <div className="text-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoices...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 bg-background min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Invoicing & AR
          </h1>
          <p className="text-slate-500 mt-1">
            Track invoices and accounts receivable
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all"
        >
          + Create Invoice
        </button>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total Invoiced"
            value={`$${stats.total_invoiced.toLocaleString()}`}
            icon="💰"
            color="blue"
          />
          <StatCard
            label="Total Paid"
            value={`$${stats.total_paid.toLocaleString()}`}
            icon="✅"
            color="green"
          />
          <StatCard
            label="Outstanding"
            value={`$${stats.total_outstanding.toLocaleString()}`}
            icon="⏳"
            color="yellow"
          />
          <StatCard
            label="Overdue"
            value={`$${stats.overdue_amount.toLocaleString()}`}
            icon="🚨"
            color="red"
          />
          <StatCard
            label="Total Invoices"
            value={invoices.length}
            icon="📄"
            color="purple"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border shadow-sm">
        <div className="flex gap-2">
          {["all", "draft", "sent", "paid", "overdue"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === status
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvoices.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-card rounded-xl border border">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No invoices found
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first invoice to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Invoice
            </button>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onView={setSelectedInvoice}
            />
          ))
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          customers={customers}
          loads={loads}
          onClose={() => setShowCreateModal(false)}
          onSave={async () => {
            await loadData();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* View Invoice Modal */}
      {selectedInvoice && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={async () => {
            await loadData();
            setSelectedInvoice(null);
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
    red: "bg-red-50 text-red-600 border-red-200",
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

// Invoice Card Component
function InvoiceCard({
  invoice,
  onView,
}: {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
}) {
  const statusColors: { [key: string]: string } = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
  };

  const isOverdue =
    invoice.status !== "paid" &&
    new Date(invoice.due_date) < new Date() &&
    invoice.balance_due > 0;

  return (
    <div className="bg-card rounded-xl border border shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {invoice.invoice_number}
          </h3>
          <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
        </div>
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
            statusColors[isOverdue ? "overdue" : invoice.status]
          }`}
        >
          {isOverdue ? "OVERDUE" : invoice.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        <p>
          <span className="font-semibold">Date:</span>{" "}
          {new Date(invoice.invoice_date).toLocaleDateString()}
        </p>
        <p>
          <span className="font-semibold">Due:</span>{" "}
          {new Date(invoice.due_date).toLocaleDateString()}
        </p>
        <p>
          <span className="font-semibold">Terms:</span> {invoice.payment_terms}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-foreground">
            ${invoice.total_amount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Balance Due</p>
          <p
            className={`text-lg font-bold ${
              invoice.balance_due > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            ${invoice.balance_due.toLocaleString()}
          </p>
        </div>
      </div>

      <button
        onClick={() => onView(invoice)}
        className="w-full px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
      >
        View Details
      </button>
    </div>
  );
}

// Create Invoice Modal Component
function CreateInvoiceModal({
  customers,
  loads,
  onClose,
  onSave,
}: {
  customers: Customer[];
  loads: Load[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [selectedLoads, setSelectedLoads] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const lineItems = selectedLoads.map((loadId) => {
        const load = loads.find((l) => l.id === loadId);
        return {
          load_id: loadId,
          description: `Load ${load?.load_number} - ${load?.pickup_address} to ${load?.delivery_address}`,
          quantity: 1,
          unit_price: load?.rate_amount || 0,
          amount: load?.rate_amount || 0,
        };
      });

      await apiFetch("/invoices/", {
        method: "POST",
        body: JSON.stringify({
          customer_id: parseInt(customerId),
          invoice_date: invoiceDate,
          payment_terms: paymentTerms,
          line_items: lineItems,
          tax_rate: 0,
        }),
      });

      onSave();
    } catch (error) {
      console.error("Failed to create invoice:", error);
      alert("Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  const toggleLoad = (loadId: number) => {
    setSelectedLoads((prev) =>
      prev.includes(loadId)
        ? prev.filter((id) => id !== loadId)
        : [...prev, loadId]
    );
  };

  const totalAmount = selectedLoads.reduce((sum, loadId) => {
    const load = loads.find((l) => l.id === loadId);
    return sum + (load?.rate_amount || 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Create Invoice</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-muted-foreground text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Payment Terms *
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Quick Pay">Quick Pay</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-right w-full">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Select Loads to Invoice *
            </label>
            <div className="max-h-64 overflow-y-auto border border rounded-lg p-4 space-y-2">
              {loads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No delivered loads available
                </p>
              ) : (
                loads.map((load) => (
                  <label
                    key={load.id}
                    className="flex items-center space-x-3 p-3 hover:bg-background rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLoads.includes(load.id)}
                      onChange={() => toggleLoad(load.id)}
                      className="w-5 h-5 text-green-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {load.load_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {load.pickup_address} → {load.delivery_address}
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      ${load.rate_amount.toLocaleString()}
                    </p>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-foreground rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || selectedLoads.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Invoice Modal Component
function ViewInvoiceModal({
  invoice,
  onClose,
  onUpdate,
}: {
  invoice: Invoice;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [recording, setRecording] = useState(false);

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    setRecording(true);
    try {
      await apiFetch(`/invoices/${invoice.id}/record-payment`, {
        method: "POST",
        params: {
          amount: parseFloat(paymentAmount),
        },
      });
      onUpdate();
    } catch (error) {
      console.error("Failed to record payment:", error);
      alert("Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  const handleMarkSent = async () => {
    try {
      await apiFetch(`/invoices/${invoice.id}/send`, {
        method: "POST",
      });
      onUpdate();
    } catch (error) {
      console.error("Failed to mark as sent:", error);
      alert("Failed to mark as sent");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">
            {invoice.invoice_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-muted-foreground text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold text-foreground">
                {invoice.customer_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold text-foreground">{invoice.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-semibold text-foreground">
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-semibold text-foreground">
                {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Line Items</h4>
            <div className="border border rounded-lg overflow-hidden">
              {invoice.line_items.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 border-b border last:border-b-0"
                >
                  <p className="font-semibold text-foreground">
                    {item.description}
                  </p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>
                      Qty: {item.quantity} × ${item.unit_price.toLocaleString()}
                    </span>
                    <span className="font-semibold">
                      ${item.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border pt-4">
            <div className="flex justify-between text-muted-foreground mb-2">
              <span>Total Amount:</span>
              <span className="font-semibold">
                ${invoice.total_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground mb-2">
              <span>Amount Paid:</span>
              <span className="font-semibold text-green-600">
                ${invoice.amount_paid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Balance Due:</span>
              <span
                className={
                  invoice.balance_due > 0 ? "text-red-600" : "text-green-600"
                }
              >
                ${invoice.balance_due.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Record Payment */}
          {invoice.balance_due > 0 && invoice.status !== "paid" && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">
                Record Payment
              </h4>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Payment amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleRecordPayment}
                  disabled={recording}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
                >
                  {recording ? "Recording..." : "Record"}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {invoice.status === "draft" && (
              <button
                onClick={handleMarkSent}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Mark as Sent
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-foreground rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
