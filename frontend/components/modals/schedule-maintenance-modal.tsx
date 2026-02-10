"use client";

import { useState } from "react";
import { X, Calendar, Wrench, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, getErrorMessage, getToken } from "@/lib/api";

interface ScheduleMaintenanceModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  equipmentList?: Array<{ id: number; identifier: string; equipment_type: string }>;
}

export function ScheduleMaintenanceModal({ onClose, onSuccess, equipmentList = [] }: ScheduleMaintenanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    unit: "",
    equipment_id: "",
    maintenance_type: "service",
    description: "",
    scheduled_date: "",
    cost: "",
    status: "scheduled"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const payload = {
        unit: form.unit,
        equipment_id: form.equipment_id ? parseInt(form.equipment_id) : null,
        maintenance_type: form.maintenance_type,
        description: form.description,
        scheduled_date: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
        cost: form.cost ? parseFloat(form.cost) * 100 : 0, // Convert to cents
        status: form.status
      };

      await apiFetch("/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to schedule maintenance"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Schedule Maintenance</h2>
              <p className="text-sm text-muted-foreground">Plan upcoming service or repairs</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit/Vehicle ID</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                placeholder="e.g., TRK-2401"
                required
              />
            </div>

            {equipmentList.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Link to Equipment</label>
                <select
                  value={form.equipment_id}
                  onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">-- Optional --</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.identifier} ({eq.equipment_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Maintenance Type</label>
              <select
                value={form.maintenance_type}
                onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                required
              >
                <option value="service">Service</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date</label>
              <input
                type="datetime-local"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Cost</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority/Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              placeholder="Oil change, brake inspection, tire rotation, etc."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Scheduling..." : "Schedule Maintenance"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
