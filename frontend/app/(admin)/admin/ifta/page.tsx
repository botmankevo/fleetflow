"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface IftaReport {
    id: number;
    quarter: number;
    year: number;
    status: string;
    total_miles: number;
    total_gallons: number;
    created_at: string;
}

interface IftaEntry {
    id: number;
    jurisdiction: string;
    entry_date: string;
    miles: number;
    gallons: number;
    notes?: string;
}

interface JurisdictionSummary {
    jurisdiction: string;
    miles: number;
    gallons: number;
    mpg: number;
}

export default function IFTAManagement() {
    const [reports, setReports] = useState<IftaReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<IftaReport | null>(null);
    const [reportDetails, setReportDetails] = useState<{entries: IftaEntry[], summary: JurisdictionSummary[]} | null>(null);
    const [showNewReportModal, setShowNewReportModal] = useState(false);
    const [showNewEntryModal, setShowNewEntryModal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [newReportQuarter, setNewReportQuarter] = useState(1);
    const [newReportYear, setNewReportYear] = useState(new Date().getFullYear());
    const [newEntry, setNewEntry] = useState({
        jurisdiction: "TX",
        entry_date: new Date().toISOString().split('T')[0],
        miles: 0,
        gallons: 0,
        notes: ""
    });

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/ifta/reports", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setReports(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load IFTA reports:", error);
            setLoading(false);
        }
    };

    const loadReportDetails = async (reportId: number) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/ifta/reports/${reportId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setReportDetails(data);
        } catch (error) {
            console.error("Failed to load report details:", error);
        }
    };

    const createReport = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/ifta/reports", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    quarter: newReportQuarter,
                    year: newReportYear
                })
            });
            if (response.ok) {
                setShowNewReportModal(false);
                loadReports();
            }
        } catch (error) {
            console.error("Failed to create report:", error);
        }
    };

    const createEntry = async () => {
        if (!selectedReport) return;
        
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/ifta/entries", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...newEntry,
                    report_id: selectedReport.id,
                    entry_date: new Date(newEntry.entry_date).toISOString()
                })
            });
            if (response.ok) {
                setShowNewEntryModal(false);
                loadReportDetails(selectedReport.id);
                loadReports();
                setNewEntry({
                    jurisdiction: "TX",
                    entry_date: new Date().toISOString().split('T')[0],
                    miles: 0,
                    gallons: 0,
                    notes: ""
                });
            }
        } catch (error) {
            console.error("Failed to create entry:", error);
        }
    };

    const updateReportStatus = async (reportId: number, status: string) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/ifta/reports/${reportId}?status=${status}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadReports();
            if (selectedReport?.id === reportId) {
                loadReportDetails(reportId);
            }
        } catch (error) {
            console.error("Failed to update report:", error);
        }
    };

    const deleteEntry = async (entryId: number) => {
        if (!confirm("Delete this entry?")) return;
        
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/ifta/entries/${entryId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (selectedReport) {
                loadReportDetails(selectedReport.id);
                loadReports();
            }
        } catch (error) {
            console.error("Failed to delete entry:", error);
        }
    };

    if (loading) {
        return (
            <div className="p-8 bg-slate-50 min-h-screen">
                <div className="text-center py-12">Loading IFTA reports...</div>
            </div>
        );
    }

    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">IFTA Management</h1>
                    <p className="text-slate-500 mt-1">International Fuel Tax Agreement reporting</p>
                </div>
                <Button onClick={() => setShowNewReportModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    + New Quarterly Report
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="text-sm text-slate-500">Total Reports</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{reports.length}</div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm text-slate-500">Draft Reports</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">
                        {reports.filter(r => r.status === 'draft').length}
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm text-slate-500">Finalized Reports</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                        {reports.filter(r => r.status === 'finalized').length}
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm text-slate-500">Filed Reports</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                        {reports.filter(r => r.status === 'filed').length}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Reports List */}
                <Card className="lg:col-span-1 p-6">
                    <h2 className="text-lg font-semibold mb-4">Quarterly Reports</h2>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {reports.map(report => (
                            <div
                                key={report.id}
                                onClick={() => {
                                    setSelectedReport(report);
                                    loadReportDetails(report.id);
                                }}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    selectedReport?.id === report.id 
                                        ? 'bg-blue-50 border-blue-300' 
                                        : 'hover:bg-slate-50 border-slate-200'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold">Q{report.quarter} {report.year}</div>
                                        <div className="text-sm text-slate-500 mt-1">
                                            {report.total_miles.toFixed(0)} miles • {report.total_gallons.toFixed(0)} gal
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        report.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                        report.status === 'finalized' ? 'bg-green-100 text-green-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {report.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {reports.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                No reports yet. Create your first quarterly report.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Report Details */}
                <Card className="lg:col-span-2 p-6">
                    {selectedReport && reportDetails ? (
                        <div className="space-y-6">
                            {/* Report Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold">Q{selectedReport.quarter} {selectedReport.year} Report</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {reportDetails.entries.length} entries • {reportDetails.summary.length} jurisdictions
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedReport.status === 'draft' && (
                                        <>
                                            <Button onClick={() => setShowNewEntryModal(true)} size="sm" variant="outline">
                                                + Add Entry
                                            </Button>
                                            <Button 
                                                onClick={() => updateReportStatus(selectedReport.id, 'finalized')}
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                Finalize
                                            </Button>
                                        </>
                                    )}
                                    {selectedReport.status === 'finalized' && (
                                        <Button 
                                            onClick={() => updateReportStatus(selectedReport.id, 'filed')}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Mark as Filed
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Summary by Jurisdiction */}
                            <div>
                                <h3 className="font-semibold mb-3">Summary by Jurisdiction</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left p-3 text-sm font-medium">State</th>
                                                <th className="text-right p-3 text-sm font-medium">Miles</th>
                                                <th className="text-right p-3 text-sm font-medium">Gallons</th>
                                                <th className="text-right p-3 text-sm font-medium">MPG</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportDetails.summary.map(item => (
                                                <tr key={item.jurisdiction} className="border-t">
                                                    <td className="p-3">{item.jurisdiction}</td>
                                                    <td className="p-3 text-right">{item.miles.toFixed(0)}</td>
                                                    <td className="p-3 text-right">{item.gallons.toFixed(1)}</td>
                                                    <td className="p-3 text-right">{item.mpg.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-semibold border-t-2">
                                            <tr>
                                                <td className="p-3">TOTAL</td>
                                                <td className="p-3 text-right">{selectedReport.total_miles.toFixed(0)}</td>
                                                <td className="p-3 text-right">{selectedReport.total_gallons.toFixed(1)}</td>
                                                <td className="p-3 text-right">
                                                    {(selectedReport.total_miles / selectedReport.total_gallons || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Entries List */}
                            <div>
                                <h3 className="font-semibold mb-3">Detailed Entries</h3>
                                <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="text-left p-3 text-sm font-medium">Date</th>
                                                <th className="text-left p-3 text-sm font-medium">State</th>
                                                <th className="text-right p-3 text-sm font-medium">Miles</th>
                                                <th className="text-right p-3 text-sm font-medium">Gallons</th>
                                                <th className="text-left p-3 text-sm font-medium">Notes</th>
                                                <th className="text-center p-3 text-sm font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportDetails.entries.map(entry => (
                                                <tr key={entry.id} className="border-t">
                                                    <td className="p-3 text-sm">
                                                        {new Date(entry.entry_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 text-sm">{entry.jurisdiction}</td>
                                                    <td className="p-3 text-sm text-right">{entry.miles.toFixed(0)}</td>
                                                    <td className="p-3 text-sm text-right">{entry.gallons.toFixed(1)}</td>
                                                    <td className="p-3 text-sm text-slate-500">{entry.notes || '-'}</td>
                                                    <td className="p-3 text-center">
                                                        {selectedReport.status === 'draft' && (
                                                            <button
                                                                onClick={() => deleteEntry(entry.id)}
                                                                className="text-red-600 hover:text-red-700 text-sm"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <div className="text-4xl mb-4">📊</div>
                            <p>Select a report to view details</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* New Report Modal */}
            {showNewReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Create Quarterly Report</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Quarter</label>
                                <select
                                    value={newReportQuarter}
                                    onChange={(e) => setNewReportQuarter(Number(e.target.value))}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value={1}>Q1 (Jan-Mar)</option>
                                    <option value={2}>Q2 (Apr-Jun)</option>
                                    <option value={3}>Q3 (Jul-Sep)</option>
                                    <option value={4}>Q4 (Oct-Dec)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Year</label>
                                <input
                                    type="number"
                                    value={newReportYear}
                                    onChange={(e) => setNewReportYear(Number(e.target.value))}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={createReport} className="flex-1">Create Report</Button>
                                <Button onClick={() => setShowNewReportModal(false)} variant="outline" className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* New Entry Modal */}
            {showNewEntryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add IFTA Entry</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input
                                    type="date"
                                    value={newEntry.entry_date}
                                    onChange={(e) => setNewEntry({...newEntry, entry_date: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Jurisdiction (State)</label>
                                <input
                                    type="text"
                                    value={newEntry.jurisdiction}
                                    onChange={(e) => setNewEntry({...newEntry, jurisdiction: e.target.value.toUpperCase()})}
                                    maxLength={2}
                                    placeholder="TX"
                                    className="w-full border rounded-lg p-2 uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Miles</label>
                                <input
                                    type="number"
                                    value={newEntry.miles}
                                    onChange={(e) => setNewEntry({...newEntry, miles: Number(e.target.value)})}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Gallons</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newEntry.gallons}
                                    onChange={(e) => setNewEntry({...newEntry, gallons: Number(e.target.value)})}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <textarea
                                    value={newEntry.notes}
                                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                    rows={2}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={createEntry} className="flex-1">Add Entry</Button>
                                <Button onClick={() => setShowNewEntryModal(false)} variant="outline" className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </main>
    );
}
