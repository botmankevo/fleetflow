"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Vendor {
    id: number;
    name: string;
    vendor_type: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    payment_terms?: string;
    is_active: boolean;
    preferred: boolean;
    rating?: number;
    notes?: string;
}

interface VendorStats {
    total_vendors: number;
    active_vendors: number;
    preferred_vendors: number;
    by_type: Record<string, number>;
}

export default function VendorManagement() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [stats, setStats] = useState<VendorStats | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [filterType, setFilterType] = useState<string>("all");
    const [filterActive, setFilterActive] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: "",
        vendor_type: "repair_shop",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        payment_terms: "NET30",
        preferred: false,
        rating: 0,
        notes: ""
    });

    useEffect(() => {
        loadVendors();
        loadStats();
    }, [filterType, filterActive]);

    const loadVendors = async () => {
        try {
            const token = localStorage.getItem("token");
            let url = "http://localhost:8000/vendors/?limit=100";
            if (filterType !== "all") url += `&vendor_type=${filterType}`;
            if (filterActive === "active") url += `&is_active=true`;
            if (filterActive === "inactive") url += `&is_active=false`;
            
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setVendors(await response.json());
            setLoading(false);
        } catch (error) {
            console.error("Failed to load vendors:", error);
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/vendors/stats/summary", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setStats(await response.json());
        } catch (error) {
            console.error("Failed to load stats:", error);
        }
    };

    const saveVendor = async () => {
        try {
            const token = localStorage.getItem("token");
            const url = editingVendor 
                ? `http://localhost:8000/vendors/${editingVendor.id}`
                : "http://localhost:8000/vendors/";
            
            const response = await fetch(url, {
                method: editingVendor ? "PUT" : "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                setShowModal(false);
                setEditingVendor(null);
                loadVendors();
                loadStats();
                resetForm();
            }
        } catch (error) {
            console.error("Failed to save vendor:", error);
        }
    };

    const deleteVendor = async (id: number) => {
        if (!confirm("Delete this vendor?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/vendors/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadVendors();
            loadStats();
        } catch (error) {
            console.error("Failed to delete vendor:", error);
        }
    };

    const editVendor = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setFormData({
            name: vendor.name,
            vendor_type: vendor.vendor_type,
            contact_name: vendor.contact_name || "",
            email: vendor.email || "",
            phone: vendor.phone || "",
            address: vendor.address || "",
            city: vendor.city || "",
            state: vendor.state || "",
            zip_code: vendor.zip_code || "",
            payment_terms: vendor.payment_terms || "NET30",
            preferred: vendor.preferred,
            rating: vendor.rating || 0,
            notes: vendor.notes || ""
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            vendor_type: "repair_shop",
            contact_name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            zip_code: "",
            payment_terms: "NET30",
            preferred: false,
            rating: 0,
            notes: ""
        });
    };

    if (loading) {
        return <div className="p-8 bg-slate-50 min-h-screen"><div className="text-center py-12">Loading...</div></div>;
    }

    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Vendor Management</h1>
                    <p className="text-slate-500 mt-1">Manage service providers, suppliers, and contractors</p>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700">
                    + Add Vendor
                </Button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Total Vendors</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total_vendors}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Active</div>
                        <div className="text-2xl font-bold text-green-600 mt-1">{stats.active_vendors}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Preferred</div>
                        <div className="text-2xl font-bold text-blue-600 mt-1">{stats.preferred_vendors}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Most Common</div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                            {Object.entries(stats.by_type).length > 0 
                                ? Object.entries(stats.by_type).sort((a, b) => b[1] - a[1])[0][0].replace('_', ' ')
                                : 'N/A'
                            }
                        </div>
                    </Card>
                </div>
            )}

            <Card className="p-4">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Vendor Type</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg p-2 pr-8">
                            <option value="all">All Types</option>
                            <option value="repair_shop">Repair Shop</option>
                            <option value="fuel_station">Fuel Station</option>
                            <option value="tire_shop">Tire Shop</option>
                            <option value="parts_supplier">Parts Supplier</option>
                            <option value="insurance">Insurance</option>
                            <option value="towing">Towing</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="border rounded-lg p-2 pr-8">
                            <option value="all">All</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Vendors</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium">Name</th>
                                <th className="text-left p-3 text-sm font-medium">Type</th>
                                <th className="text-left p-3 text-sm font-medium">Contact</th>
                                <th className="text-left p-3 text-sm font-medium">Location</th>
                                <th className="text-left p-3 text-sm font-medium">Payment Terms</th>
                                <th className="text-center p-3 text-sm font-medium">Rating</th>
                                <th className="text-center p-3 text-sm font-medium">Status</th>
                                <th className="text-center p-3 text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(vendors) && vendors.map(vendor => (
                                <tr key={vendor.id} className="border-t hover:bg-slate-50">
                                    <td className="p-3">
                                        <div className="font-medium">{vendor.name}</div>
                                        {vendor.preferred && <span className="text-xs text-blue-600">⭐ Preferred</span>}
                                    </td>
                                    <td className="p-3 text-sm capitalize">{vendor.vendor_type.replace('_', ' ')}</td>
                                    <td className="p-3 text-sm">
                                        <div>{vendor.contact_name || '-'}</div>
                                        <div className="text-slate-500 text-xs">{vendor.phone || vendor.email || '-'}</div>
                                    </td>
                                    <td className="p-3 text-sm">{vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : '-'}</td>
                                    <td className="p-3 text-sm">{vendor.payment_terms || '-'}</td>
                                    <td className="p-3 text-center">
                                        {vendor.rating ? (
                                            <span className="text-yellow-500">{'⭐'.repeat(Math.round(vendor.rating))}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            vendor.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {vendor.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => editVendor(vendor)} className="text-blue-600 hover:text-blue-700 text-sm mr-2">
                                            Edit
                                        </button>
                                        <button onClick={() => deleteVendor(vendor.id)} className="text-red-600 hover:text-red-700 text-sm">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {vendors.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <div className="text-4xl mb-4">🏪</div>
                            <p>No vendors found</p>
                        </div>
                    )}
                </div>
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <Card className="p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">{editingVendor ? 'Edit' : 'Add'} Vendor</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Vendor Type *</label>
                                <select value={formData.vendor_type} onChange={(e) => setFormData({...formData, vendor_type: e.target.value})} className="w-full border rounded-lg p-2">
                                    <option value="repair_shop">Repair Shop</option>
                                    <option value="fuel_station">Fuel Station</option>
                                    <option value="tire_shop">Tire Shop</option>
                                    <option value="parts_supplier">Parts Supplier</option>
                                    <option value="permit_service">Permit Service</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="towing">Towing</option>
                                    <option value="wash_service">Wash Service</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Contact Name</label>
                                <input type="text" value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">State</label>
                                <input type="text" maxLength={2} value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Zip Code</label>
                                <input type="text" value={formData.zip_code} onChange={(e) => setFormData({...formData, zip_code: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                                <select value={formData.payment_terms} onChange={(e) => setFormData({...formData, payment_terms: e.target.value})} className="w-full border rounded-lg p-2">
                                    <option value="COD">Cash on Delivery</option>
                                    <option value="NET15">Net 15</option>
                                    <option value="NET30">Net 30</option>
                                    <option value="NET60">Net 60</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
                                <input type="number" min="0" max="5" step="0.5" value={formData.rating} onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={formData.preferred} onChange={(e) => setFormData({...formData, preferred: e.target.checked})} className="rounded" />
                                    <span className="text-sm font-medium">Mark as Preferred Vendor</span>
                                </label>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full border rounded-lg p-2" rows={3} />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button onClick={saveVendor} className="flex-1">Save Vendor</Button>
                            <Button onClick={() => { setShowModal(false); setEditingVendor(null); resetForm(); }} variant="outline" className="flex-1">Cancel</Button>
                        </div>
                    </Card>
                </div>
            )}
        </main>
    );
}
