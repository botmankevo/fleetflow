"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";
import { DollarSign, Users, TrendingUp, ChevronRight } from "lucide-react";

type Payee = {
  id: number;
  name: string;
  payee_type: string;
};

type GroupedPayable = {
  payee_id: number;
  payee_name: string;
  payee_type: string;
  total_owed: number;
  pending_line_count: number;
};

type LedgerLine = {
  id: number;
  load_id: number | null;
  load_info: {
    id: number;
    load_number: string;
    pickup_location: string;
    delivery_location: string;
    status: string;
  } | null;
  category: string;
  description: string;
  amount: number;
  created_at: string;
};

type PayeeDetail = {
  payee_id: number;
  payee_name: string;
  payee_type: string;
  lines: LedgerLine[];
  total: number;
};

type Settlement = {
  id: number;
  payee_id: number;
  period_start: string;
  period_end: string;
  status: string;
  paid_at: string | null;
  exported_at: string | null;
};

type SettlementDetail = {
  settlement_id: number;
  payee_name: string;
  period_start: string;
  period_end: string;
  status: string;
  lines: LedgerLine[];
  total: number;
};

export default function PayrollPage() {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [groupedPayables, setGroupedPayables] = useState<GroupedPayable[]>([]);
  const [selectedPayeeDetail, setSelectedPayeeDetail] = useState<PayeeDetail | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementDetail | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<string>("");
  const [periodStart, setPeriodStart] = useState("2026-01-26");
  const [periodEnd, setPeriodEnd] = useState("2026-02-01");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "settlements">("pending");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      // Load payees list
      const payeesRes = await apiFetch("/payroll/payees", { headers });
      setPayees(payeesRes);
      
      // Load grouped payables
      const groupedRes = await apiFetch("/payroll/payables-grouped", { headers });
      setGroupedPayables(groupedRes);
      
      // Load settlements
      const settlementsRes = await apiFetch("/payroll/settlements", { headers });
      setSettlements(settlementsRes);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load payroll data"));
    } finally {
      setLoading(false);
    }
  }

  async function loadPayeeDetails(payeeId: number) {
    setLoading(true);
    setSelectedPayeeDetail(null);
    try {
      const token = getToken();
      const res = await apiFetch(`/payroll/payables-grouped/${payeeId}/lines`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setSelectedPayeeDetail(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load payee details"));
    } finally {
      setLoading(false);
    }
  }

  async function createSettlement() {
    setError(null);
    setMessage(null);
    try {
      const token = getToken();
      const res = await apiFetch("/payroll/settlements", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payee_id: Number(selectedPayee),
          period_start: new Date(periodStart).toISOString(),
          period_end: new Date(periodEnd).toISOString(),
        }),
      });
      setMessage(`Created settlement #${res.id} (${res.status})`);
      setSelectedPayee("");
      loadData(); // Refresh data
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create settlement"));
    }
  }

  async function loadSettlementDetail(settlementId: number) {
    setLoading(true);
    setSelectedSettlement(null);
    try {
      const token = getToken();
      const res = await apiFetch(`/payroll/settlements/${settlementId}/lines`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setSelectedSettlement(res);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load settlement details"));
    } finally {
      setLoading(false);
    }
  }

  async function approveSettlement(settlementId: number) {
    try {
      const token = getToken();
      await apiFetch(`/payroll/settlements/${settlementId}/approve`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMessage("Settlement approved successfully");
      loadData();
      if (selectedSettlement?.settlement_id === settlementId) {
        loadSettlementDetail(settlementId);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to approve settlement"));
    }
  }

  async function paySettlement(settlementId: number) {
    try {
      const token = getToken();
      await apiFetch(`/payroll/settlements/${settlementId}/pay`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMessage("Settlement marked as paid and lines locked");
      loadData();
      if (selectedSettlement?.settlement_id === settlementId) {
        loadSettlementDetail(settlementId);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to mark settlement as paid"));
    }
  }

  async function exportSettlement(settlementId: number) {
    try {
      const token = getToken();
      await apiFetch(`/payroll/settlements/${settlementId}/export`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMessage("Settlement exported successfully");
      loadData();
      if (selectedSettlement?.settlement_id === settlementId) {
        loadSettlementDetail(settlementId);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to export settlement"));
    }
  }

  async function voidSettlement(settlementId: number) {
    if (!confirm("Are you sure you want to void this settlement? This will release all lines back to pending.")) {
      return;
    }
    try {
      const token = getToken();
      await apiFetch(`/payroll/settlements/${settlementId}/void`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMessage("Settlement voided successfully");
      setSelectedSettlement(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to void settlement"));
    }
  }

  const totalOwed = groupedPayables.reduce((sum, p) => sum + p.total_owed, 0);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Driver Payroll</h1>
        <p className="text-gray-600 mt-1">Manage driver payments and settlements</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Owed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${totalOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payees with Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{groupedPayables.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {groupedPayables.reduce((sum, p) => sum + p.pending_line_count, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Payables ({groupedPayables.length})
            </button>
            <button
              onClick={() => setActiveTab("settlements")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "settlements"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Settlements ({settlements.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Grouped Payables List */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payables by Driver/Payee</h2>
            <p className="text-sm text-gray-600 mt-1">Click on a payee to view detailed line items</p>
          </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : groupedPayables.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending payables found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupedPayables.map((payable) => (
              <div
                key={payable.payee_id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => loadPayeeDetails(payable.payee_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{payable.payee_name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600 capitalize">{payable.payee_type.replace('_', ' ')}</span>
                      <span className="text-sm text-gray-600">
                        {payable.pending_line_count} pending {payable.pending_line_count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${payable.total_owed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">Total Owed</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Settlements List */}
      {activeTab === "settlements" && (
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Settlement History</h2>
            <p className="text-sm text-gray-600 mt-1">View and manage payroll settlements</p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : settlements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No settlements found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settlements.map((settlement) => {
                    const payee = payees.find(p => p.id === settlement.payee_id);
                    return (
                      <tr key={settlement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{settlement.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payee?.name || `Payee ${settlement.payee_id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(settlement.period_start).toLocaleDateString()} - {new Date(settlement.period_end).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            settlement.status === "paid" ? "bg-green-100 text-green-800" :
                            settlement.status === "approved" ? "bg-blue-100 text-blue-800" :
                            settlement.status === "exported" ? "bg-purple-100 text-purple-800" :
                            settlement.status === "voided" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {settlement.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {settlement.paid_at ? new Date(settlement.paid_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => loadSettlementDetail(settlement.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                          {settlement.status === "draft" && (
                            <>
                              <button
                                onClick={() => approveSettlement(settlement.id)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => voidSettlement(settlement.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Void
                              </button>
                            </>
                          )}
                          {settlement.status === "approved" && (
                            <button
                              onClick={() => paySettlement(settlement.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Mark Paid
                            </button>
                          )}
                          {settlement.status === "paid" && (
                            <button
                              onClick={() => exportSettlement(settlement.id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Export
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settlement Detail Modal */}
      {selectedSettlement && (
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Settlement #{selectedSettlement.settlement_id} - {selectedSettlement.payee_name}
                </h2>
                <p className="text-sm text-gray-600">
                  Period: {new Date(selectedSettlement.period_start).toLocaleDateString()} - {new Date(selectedSettlement.period_end).toLocaleDateString()}
                </p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                  selectedSettlement.status === "paid" ? "bg-green-100 text-green-800" :
                  selectedSettlement.status === "approved" ? "bg-blue-100 text-blue-800" :
                  selectedSettlement.status === "exported" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {selectedSettlement.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ${selectedSettlement.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">{selectedSettlement.lines.length} line items</p>
                <button
                  onClick={() => setSelectedSettlement(null)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedSettlement.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {line.load_info ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{line.load_info.load_number}</div>
                          <div className="text-xs text-gray-500">{line.load_info.status}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non-load item</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {line.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{line.description || '-'}</div>
                      {line.load_info && (
                        <div className="text-xs text-gray-500 mt-1">
                          {line.load_info.pickup_address} → {line.load_info.delivery_address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.created_at ? new Date(line.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {line.locked_at ? (
                        <span className="flex items-center text-xs text-gray-500">
                          🔒 Locked
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Unlocked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      ${line.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedSettlement.lines.filter(l => l.locked_at).length} of {selectedSettlement.lines.length} lines locked
            </div>
            <div className="flex gap-2">
              {selectedSettlement.status === "draft" && (
                <>
                  <button
                    onClick={() => approveSettlement(selectedSettlement.settlement_id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Approve Settlement
                  </button>
                  <button
                    onClick={() => voidSettlement(selectedSettlement.settlement_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Void Settlement
                  </button>
                </>
              )}
              {selectedSettlement.status === "approved" && (
                <button
                  onClick={() => paySettlement(selectedSettlement.settlement_id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Paid
                </button>
              )}
              {selectedSettlement.status === "paid" && (
                <button
                  onClick={() => exportSettlement(selectedSettlement.settlement_id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Export to QuickBooks
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payee Detail Modal/Section */}
      {selectedPayeeDetail && (
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPayeeDetail.payee_name}</h2>
                <p className="text-sm text-gray-600 capitalize">{selectedPayeeDetail.payee_type.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ${selectedPayeeDetail.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">{selectedPayeeDetail.lines.length} line items</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedPayeeDetail.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {line.load_info ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{line.load_info.load_number}</div>
                          <div className="text-xs text-gray-500">{line.load_info.status}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {line.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{line.description || '-'}</div>
                      {line.load_info && (
                        <div className="text-xs text-gray-500 mt-1">
                          {line.load_info.pickup_location} → {line.load_info.delivery_location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.created_at ? new Date(line.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      ${line.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                setSelectedPayee(selectedPayeeDetail.payee_id.toString());
                setSelectedPayeeDetail(null);
              }}
            >
              Create Settlement for {selectedPayeeDetail.payee_name}
            </button>
          </div>
        </div>
      )}

      {/* Create Settlement Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Settlement</h2>
          <p className="text-sm text-gray-600 mt-1">Create a payment settlement for a payee</p>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Payee</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedPayee}
                onChange={(e) => setSelectedPayee(e.target.value)}
              >
                <option value="">Select payee</option>
                {payees.map((payee) => (
                  <option key={payee.id} value={payee.id}>
                    {payee.name} ({payee.payee_type})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period Start</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period End</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
          
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            disabled={!selectedPayee}
            onClick={createSettlement}
          >
            Create Settlement Draft
          </button>
        </div>
      </div>
    </main>
  );
}
