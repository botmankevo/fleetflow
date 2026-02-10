"use client";

import { useState, useEffect } from "react";
import { apiFetch, getToken, getErrorMessage, getDriverId } from "@/lib/api";

type Settlement = {
  settlement_id: number;
  period_start: string;
  period_end: string;
  status: string;
  paid_at: string | null;
  total: number;
  line_count: number;
};

type PayHistory = {
  driver: {
    id: number;
    name: string;
    payee_id: number;
  };
  summary: {
    total_earned: number;
    settlement_count: number;
    paid_settlements: number;
    pending_amount: number;
  };
  history: Settlement[];
};

export default function DriverPayHistoryPage() {
  const [payHistory, setPayHistory] = useState<PayHistory | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayHistory();
  }, []);

  async function loadPayHistory() {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Get current driver ID from authenticated token
      const driverId = getDriverId();
      
      if (!driverId) {
        setError("Unable to determine driver ID. Please log in again.");
        setLoading(false);
        return;
      }

      const data = await apiFetch(`/payroll/reports/driver/${driverId}/history`, { headers });
      setPayHistory(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load pay history"));
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "exported":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your pay history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Pay History</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadPayHistory}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!payHistory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No pay history available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pay History</h1>
              <p className="text-gray-600 mt-1">Welcome back, {payHistory.driver.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Driver ID</p>
              <p className="text-2xl font-bold text-gray-900">#{payHistory.driver.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Earned</p>
            <p className="text-3xl font-bold text-green-600">
              ${payHistory.summary.total_earned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">From paid settlements</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Pay</p>
            <p className="text-3xl font-bold text-blue-600">
              ${payHistory.summary.pending_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Not yet paid</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Settlements</p>
            <p className="text-3xl font-bold text-gray-900">{payHistory.summary.settlement_count}</p>
            <p className="text-xs text-gray-500 mt-1">{payHistory.summary.paid_settlements} paid</p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Average Per Settlement</p>
            <p className="text-3xl font-bold text-gray-900">
              ${payHistory.summary.settlement_count > 0 
                ? (payHistory.summary.total_earned / payHistory.summary.paid_settlements).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">For paid settlements</p>
          </div>
        </div>

        {/* Settlements List */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Settlement History</h2>
            <p className="text-sm text-gray-600 mt-1">View all your pay settlements and details</p>
          </div>

          {payHistory.history.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No settlements found</p>
              <p className="text-sm mt-2">Your pay settlements will appear here once created</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payHistory.history.map((settlement) => (
                    <tr key={settlement.settlement_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{settlement.settlement_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(settlement.period_start).toLocaleDateString()} - {new Date(settlement.period_end).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(settlement.status)}`}>
                          {settlement.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {settlement.paid_at ? new Date(settlement.paid_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {settlement.line_count} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-lg font-semibold ${settlement.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${settlement.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedSettlement(settlement.settlement_id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Settlement Detail Modal */}
        {selectedSettlement && (
          <SettlementDetailModal
            settlementId={selectedSettlement}
            onClose={() => setSelectedSettlement(null)}
          />
        )}
      </div>
    </div>
  );
}

// Settlement Detail Modal Component
function SettlementDetailModal({ settlementId, onClose }: { settlementId: number; onClose: () => void }) {
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettlementDetail();
  }, [settlementId]);

  async function loadSettlementDetail() {
    setLoading(true);
    try {
      const token = getToken();
      const data = await apiFetch(`/payroll/settlements/${settlementId}/lines`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setSettlement(data);
    } catch (err) {
      console.error("Failed to load settlement details:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Settlement #{settlementId}</h2>
              {settlement && (
                <p className="text-sm text-gray-600 mt-1">
                  {settlement.payee_name} • {new Date(settlement.period_start).toLocaleDateString()} - {new Date(settlement.period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading details...</p>
            </div>
          ) : settlement ? (
            <>
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  settlement.status === "paid" ? "bg-green-100 text-green-800" :
                  settlement.status === "approved" ? "bg-blue-100 text-blue-800" :
                  settlement.status === "exported" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {settlement.status.toUpperCase()}
                </span>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                {settlement.lines.map((line: any) => (
                  <div key={line.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            {line.category}
                          </span>
                          {line.locked_at && (
                            <span className="text-amber-600 text-xs">🔒 Locked</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-medium mt-2">{line.description || 'No description'}</p>
                        {line.load_info && (
                          <p className="text-xs text-gray-500 mt-1">
                            Load {line.load_info.load_number}: {line.load_info.pickup_location} → {line.load_info.delivery_location}
                          </p>
                        )}
                        {line.created_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(line.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${line.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {line.amount >= 0 ? '+' : ''}{line.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-green-600">
                    ${settlement.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-12">Failed to load settlement details</p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
