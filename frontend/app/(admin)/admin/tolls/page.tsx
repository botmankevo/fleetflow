"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TollTransaction {
    id: number;
    load_id?: number;
    driver_id?: number;
    equipment_id?: number;
    transponder_id?: number;
    transaction_date: string;
    toll_authority: string;
    location: string;
    amount: number;
    reference_number?: string;
    status: string;
    reimbursed: boolean;
    notes?: string;
}

interface TollTransponder {
    id: number;
    transponder_number: string;
    provider: string;
    equipment_id?: number;
    status: string;
    activation_date: string;
    balance: number;
    auto_replenish: boolean;
    replenish_threshold: number;
    replenish_amount: number;
}

interface TollStats {
    total_amount: number;
    pending_amount: number;
    verified_amount: number;
    reimbursed_amount: number;
    total_transactions: number;
    active_transponders: number;
}

export default function TollsManagement() {
    const [activeTab, setActiveTab] = useState<"transactions" | "transponders">("transactions");
    const [transactions, setTransactions] = useState<TollTransaction[]>([]);
    const [transponders, setTransponders] = useState<TollTransponder[]>([]);
    const [stats, setStats] = useState<TollStats | null>(null);
    const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
    const [showNewTransponderModal, setShowNewTransponderModal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [newTransaction, setNewTransaction] = useState({
        transaction_date: new Date().toISOString().split('T')[0],
        toll_authority: "EZPass",
        location: "",
        amount: 0,
        reference_number: "",
        notes: ""
    });

    const [newTransponder, setNewTransponder] = useState({
        transponder_number: "",
        provider: "EZPass",
        activation_date: new Date().toISOString().split('T')[0],
        balance: 0,
        auto_replenish: true,
        replenish_threshold: 20,
        replenish_amount: 50
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = localStorage.getItem("token");
            const [txnRes, transponderRes, statsRes] = await Promise.all([
                fetch("http://localhost:8000/tolls/transactions?limit=100", {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch("http://localhost:8000/tolls/transponders", {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch("http://localhost:8000/tolls/stats", {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ]);
            
            setTransactions(await txnRes.json());
            setTransponders(await transponderRes.json());
            setStats(await statsRes.json());
            setLoading(false);
        } catch (error) {
            console.error("Failed to load toll data:", error);
            setLoading(false);
        }
    };

    const createTransaction = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/tolls/transactions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...newTransaction,
                    transaction_date: new Date(newTransaction.transaction_date).toISOString()
                })
            });
            if (response.ok) {
                setShowNewTransactionModal(false);
                loadData();
                setNewTransaction({
                    transaction_date: new Date().toISOString().split('T')[0],
                    toll_authority: "EZPass",
                    location: "",
                    amount: 0,
                    reference_number: "",
                    notes: ""
                });
            }
        } catch (error) {
            console.error("Failed to create transaction:", error);
        }
    };

    const createTransponder = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/tolls/transponders", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...newTransponder,
                    activation_date: new Date(newTransponder.activation_date).toISOString()
                })
            });
            if (response.ok) {
                setShowNewTransponderModal(false);
                loadData();
                setNewTransponder({
                    transponder_number: "",
                    provider: "EZPass",
                    activation_date: new Date().toISOString().split('T')[0],
                    balance: 0,
                    auto_replenish: true,
                    replenish_threshold: 20,
                    replenish_amount: 50
                });
            }
        } catch (error) {
            console.error("Failed to create transponder:", error);
        }
    };

    const updateTransactionStatus = async (id: number, status: string) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/tolls/transactions/${id}?status=${status}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadData();
        } catch (error) {
            console.error("Failed to update transaction:", error);
        }
    };

    const deleteTransaction = async (id: number) => {
        if (!confirm("Delete this toll transaction?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/tolls/transactions/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadData();
        } catch (error) {
            console.error("Failed to delete transaction:", error);
        }
    };

    if (loading) {
        return <div className="p-8 bg-slate-50 min-h-screen"><div className="text-center py-12">Loading...</div></div>;
    }

    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Tolls & Transponders</h1>
                    <p className="text-slate-500 mt-1">Manage toll transactions and transponder accounts</p>
                </div>
                <Button 
                    onClick={() => activeTab === "transactions" ? setShowNewTransactionModal(true) : setShowNewTransponderModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    + {activeTab === "transactions" ? "Add Transaction" : "Add Transponder"}
                </Button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Total Spent</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">${stats.total_amount.toFixed(2)}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Pending</div>
                        <div className="text-2xl font-bold text-amber-600 mt-1">${stats.pending_amount.toFixed(2)}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Verified</div>
                        <div className="text-2xl font-bold text-green-600 mt-1">${stats.verified_amount.toFixed(2)}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Reimbursed</div>
                        <div className="text-2xl font-bold text-blue-600 mt-1">${stats.reimbursed_amount.toFixed(2)}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Transactions</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total_transactions}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Active Transponders</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.active_transponders}</div>
                    </Card>
                </div>
            )}

            <Card className="p-6">
                <div className="flex gap-4 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={`pb-2 px-1 font-medium ${activeTab === "transactions" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab("transponders")}
                        className={`pb-2 px-1 font-medium ${activeTab === "transponders" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`}
                    >
                        Transponders
                    </button>
                </div>

                {activeTab === "transactions" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left p-3 text-sm font-medium">Date</th>
                                    <th className="text-left p-3 text-sm font-medium">Authority</th>
                                    <th className="text-left p-3 text-sm font-medium">Location</th>
                                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                                    <th className="text-left p-3 text-sm font-medium">Reference</th>
                                    <th className="text-center p-3 text-sm font-medium">Status</th>
                                    <th className="text-center p-3 text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(txn => (
                                    <tr key={txn.id} className="border-t">
                                        <td className="p-3 text-sm">{new Date(txn.transaction_date).toLocaleDateString()}</td>
                                        <td className="p-3 text-sm">{txn.toll_authority}</td>
                                        <td className="p-3 text-sm">{txn.location}</td>
                                        <td className="p-3 text-sm text-right font-medium">${txn.amount.toFixed(2)}</td>
                                        <td className="p-3 text-sm text-slate-500">{txn.reference_number || '-'}</td>
                                        <td className="p-3 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                txn.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                txn.status === 'verified' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            {txn.status === 'pending' && (
                                                <button
                                                    onClick={() => updateTransactionStatus(txn.id, 'verified')}
                                                    className="text-green-600 hover:text-green-700 text-sm mr-2"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteTransaction(txn.id)}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <div className="text-4xl mb-4">🛣️</div>
                                <p>No toll transactions yet</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {transponders.map(t => (
                            <Card key={t.id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="font-semibold text-lg">{t.transponder_number}</div>
                                        <div className="text-sm text-slate-500">{t.provider}</div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {t.status}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Balance:</span>
                                        <span className="font-medium">${t.balance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Auto-Replenish:</span>
                                        <span>{t.auto_replenish ? 'Yes' : 'No'}</span>
                                    </div>
                                    {t.auto_replenish && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Threshold:</span>
                                                <span>${t.replenish_threshold.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Replenish Amount:</span>
                                                <span>${t.replenish_amount.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                        {transponders.length === 0 && (
                            <div className="col-span-2 text-center py-12 text-slate-400">
                                <div className="text-4xl mb-4">🎫</div>
                                <p>No transponders configured</p>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {showNewTransactionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add Toll Transaction</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input type="date" value={newTransaction.transaction_date} onChange={(e) => setNewTransaction({...newTransaction, transaction_date: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Toll Authority</label>
                                <select value={newTransaction.toll_authority} onChange={(e) => setNewTransaction({...newTransaction, toll_authority: e.target.value})} className="w-full border rounded-lg p-2">
                                    <option value="EZPass">EZPass</option>
                                    <option value="PrePass">PrePass</option>
                                    <option value="BestPass">BestPass</option>
                                    <option value="IPass">I-Pass</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Location</label>
                                <input type="text" value={newTransaction.location} onChange={(e) => setNewTransaction({...newTransaction, location: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Toll plaza name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount</label>
                                <input type="number" step="0.01" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={createTransaction} className="flex-1">Add Transaction</Button>
                                <Button onClick={() => setShowNewTransactionModal(false)} variant="outline" className="flex-1">Cancel</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {showNewTransponderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add Transponder</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Transponder Number</label>
                                <input type="text" value={newTransponder.transponder_number} onChange={(e) => setNewTransponder({...newTransponder, transponder_number: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Provider</label>
                                <select value={newTransponder.provider} onChange={(e) => setNewTransponder({...newTransponder, provider: e.target.value})} className="w-full border rounded-lg p-2">
                                    <option value="EZPass">EZPass</option>
                                    <option value="PrePass">PrePass</option>
                                    <option value="BestPass">BestPass</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Activation Date</label>
                                <input type="date" value={newTransponder.activation_date} onChange={(e) => setNewTransponder({...newTransponder, activation_date: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Initial Balance</label>
                                <input type="number" step="0.01" value={newTransponder.balance} onChange={(e) => setNewTransponder({...newTransponder, balance: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={createTransponder} className="flex-1">Add Transponder</Button>
                                <Button onClick={() => setShowNewTransponderModal(false)} variant="outline" className="flex-1">Cancel</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </main>
    );
}
