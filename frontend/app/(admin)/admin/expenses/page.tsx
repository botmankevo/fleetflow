"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Expense {
    id: number;
    driver_id: number | null;
    vendor_id: number | null;
    load_id: number | null;
    equipment_id: number | null;
    amount: number;
    category: string | null;
    description: string | null;
    status: string;
    approved_by: number | null;
    approved_at: string | null;
    occurred_at: string | null;
    receipt_link: string | null;
    created_at: string;
}

interface Vendor {
    id: number;
    name: string;
    vendor_type: string;
}

export default function AdminExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const [formData, setFormData] = useState({
        vendor_id: "",
        amount: "",
        category: "fuel",
        description: "",
        occurred_at: new Date().toISOString().split('T')[0],
        receipt_link: "",
    });

    const categories = [
        "fuel", "repairs", "maintenance", "tolls", "parking", 
        "permits", "lumper_fees", "scales", "tires", "parts", "other"
    ];

    useEffect(() => {
        loadData();
    }, [filterCategory, filterStatus]);

    const loadData = async () => {
        try {
            const token = localStorage.getItem("token");
            const [expensesRes, vendorsRes] = await Promise.all([
                fetch("http://localhost:8000/expenses/", {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch("http://localhost:8000/vendors/?is_active=true", {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ]);
            
            setExpenses(await expensesRes.json());
            setVendors(await vendorsRes.json());
            setLoading(false);
        } catch (error) {
            console.error("Failed to load data:", error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const url = editingExpense 
                ? `http://localhost:8000/expenses/${editingExpense.id}`
                : "http://localhost:8000/expenses/";
            
            const response = await fetch(url, {
                method: editingExpense ? "PUT" : "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
                    amount: Math.round(parseFloat(formData.amount) * 100),
                }),
            });

            if (response.ok) {
                loadData();
                setShowModal(false);
                setEditingExpense(null);
                resetForm();
            }
        } catch (error) {
            console.error("Failed to save expense:", error);
        }
    };

    const approveExpense = async (id: number) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/expenses/${id}?status=approved`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadData();
        } catch (error) {
            console.error("Failed to approve expense:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this expense?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/expenses/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadData();
        } catch (error) {
            console.error("Failed to delete expense:", error);
        }
    };

    const resetForm = () => {
        setFormData({
            vendor_id: "",
            amount: "",
            category: "fuel",
            description: "",
            occurred_at: new Date().toISOString().split('T')[0],
            receipt_link: "",
        });
    };

    const filteredExpenses = expenses.filter(e => {
        if (filterCategory !== "all" && e.category !== filterCategory) return false;
        if (filterStatus !== "all" && e.status !== filterStatus) return false;
        return true;
    });

    const stats = {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        pending: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
        approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
    };

    if (loading) {
        return <div className="p-8 bg-slate-50 min-h-screen"><div className="text-center py-12">Loading...</div></div>;
    }

    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Expense Management</h1>
                    <p className="text-slate-500 mt-1">Track, approve, and manage company expenses</p>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700">
                    + Add Expense
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="text-sm text-slate-500">Total Expenses</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">${(stats.total / 100).toFixed(2)}</div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm text-slate-500">Pending</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">${(stats.pending / 100).toFixed(2)}</div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm text-slate-500">Approved</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">${(stats.approved / 100).toFixed(2)}</div>
                </Card>
            </div>

            <Card className="p-4">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border rounded-lg p-2 pr-8">
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-lg p-2 pr-8">
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Expenses</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium">Date</th>
                                <th className="text-left p-3 text-sm font-medium">Category</th>
                                <th className="text-left p-3 text-sm font-medium">Vendor</th>
                                <th className="text-left p-3 text-sm font-medium">Description</th>
                                <th className="text-right p-3 text-sm font-medium">Amount</th>
                                <th className="text-center p-3 text-sm font-medium">Status</th>
                                <th className="text-center p-3 text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((expense) => (
                                <tr key={expense.id} className="border-t hover:bg-slate-50">
                                    <td className="p-3 text-sm">
                                        {expense.occurred_at ? new Date(expense.occurred_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-3 text-sm capitalize">{expense.category?.replace('_', ' ') || '-'}</td>
                                    <td className="p-3 text-sm">
                                        {expense.vendor_id ? vendors.find(v => v.id === expense.vendor_id)?.name || '-' : '-'}
                                    </td>
                                    <td className="p-3 text-sm max-w-xs truncate">{expense.description || '-'}</td>
                                    <td className="p-3 text-sm text-right font-medium">
                                        ${(expense.amount / 100).toFixed(2)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            expense.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center space-x-2">
                                        {expense.status === 'pending' && (
                                            <button onClick={() => approveExpense(expense.id)} className="text-green-600 hover:text-green-700 text-sm">
                                                Approve
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-700 text-sm">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredExpenses.length === 0 && (
                        <div className="text-center py-12 text-slate-400">No expenses found</div>
                    )}
                </div>
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date *</label>
                                <input type="date" value={formData.occurred_at} onChange={(e) => setFormData({...formData, occurred_at: e.target.value})} className="w-full border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category *</label>
                                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg p-2" required>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount *</label>
                                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Vendor</label>
                                <select value={formData.vendor_id} onChange={(e) => setFormData({...formData, vendor_id: e.target.value})} className="w-full border rounded-lg p-2">
                                    <option value="">None</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1">Create</Button>
                                <Button type="button" onClick={() => { setShowModal(false); resetForm(); }} variant="outline" className="flex-1">Cancel</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </main>
    );
}
