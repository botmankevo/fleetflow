"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState, CardSkeleton } from "@/components/ui/loading-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import EmptyState from "@/components/ui/empty-state";
import { DataExport, exportToCSV } from "@/components/ui/data-export";
import { Wrench, Plus, RefreshCw, Upload, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MaintenanceSchedulerWidget } from "@/components/dashboard/maintenance-scheduler-widget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleMaintenanceModal } from "@/components/modals/schedule-maintenance-modal";
import { MaintenanceCalendar } from "@/components/maintenance/maintenance-calendar";

type Maintenance = {
  id: number;
  unit?: string | null;
  description?: string | null;
  cost: number;
  occurred_at?: string | null;
  receipt_link?: string | null;
};

export default function AdminMaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [scheduledItems, setScheduledItems] = useState<Maintenance[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [form, setForm] = useState({
    unit: "",
    description: "",
    cost: "",
    occurredAt: "",
    receipt: null as File | null,
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      setLoading(true);
      const token = getToken();
      
      // Fetch records, scheduled items, and equipment in parallel
      const [recordsRes, scheduledRes, equipmentRes] = await Promise.all([
        apiFetch("/maintenance", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }),
        apiFetch("/maintenance/scheduled", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }),
        apiFetch("/equipment", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(() => []) // Equipment is optional
      ]);
      
      setRecords(recordsRes);
      setScheduledItems(scheduledRes);
      setEquipment(equipmentRes);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load maintenance data"));
    } finally {
      setLoading(false);
    }
  }

  const handleExportCSV = () => {
    const exportData = records.map(rec => ({
      Unit: rec.unit || 'N/A',
      Description: rec.description || 'N/A',
      Cost: `$${rec.cost}`,
      Date: rec.occurred_at ? new Date(rec.occurred_at).toLocaleDateString() : 'N/A',
      Receipt: rec.receipt_link ? 'Yes' : 'No'
    }));
    exportToCSV(exportData, `maintenance-${new Date().toISOString().split('T')[0]}.csv`);
  };

  async function createRecord(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const token = getToken();
      const created = await apiFetch("/maintenance", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unit: form.unit || null,
          description: form.description || null,
          cost: Number(form.cost || 0),
          occurred_at: form.occurredAt ? new Date(form.occurredAt).toISOString() : null,
        }),
      });
      if (form.receipt) {
        const data = new FormData();
        data.append("file", form.receipt);
        await apiFetch(`/maintenance/${created.id}/receipt`, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: data,
        });
      }
      setForm({ unit: "", description: "", cost: "", occurredAt: "", receipt: null });
      await fetchRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create maintenance record"));
    } finally {
      setCreating(false);
    }
  }

  async function uploadReceipt(recordId: number, file: File) {
    try {
      setUploadingId(recordId);
      const token = getToken();
      const data = new FormData();
      data.append("file", file);
      await apiFetch(`/maintenance/${recordId}/receipt`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: data,
      });
      await fetchRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload receipt"));
    } finally {
      setUploadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Maintenance"
          description="Track maintenance records, costs, and receipts"
          breadcrumbs={[{ label: 'Fleet' }, { label: 'Maintenance' }]}
        />
        <div className="p-6">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Schedule and track maintenance records, costs, and receipts"
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Maintenance' }]}
        actions={
          <>
            <DataExport onExportCSV={handleExportCSV} />
            <Button onClick={fetchRecords} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchRecords} onDismiss={() => setError(null)} />}

      <div className="px-6">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="records">
              <FileText className="mr-2 h-4 w-4" />
              Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            {showCalendar ? (
              <div>
                <div className="mb-4">
                  <Button variant="outline" onClick={() => setShowCalendar(false)}>
                    ← Back to Schedule
                  </Button>
                </div>
                <MaintenanceCalendar 
                  maintenanceItems={scheduledItems}
                  onItemClick={(item) => {
                    // Could open a detail modal here
                    console.log('Clicked item:', item);
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {scheduledItems.length > 0 ? (
                    <div className="space-y-4">
                      {scheduledItems.map((item) => {
                        const daysUntil = item.scheduled_date 
                          ? Math.ceil((new Date(item.scheduled_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          : 0;
                        
                        const priority = daysUntil <= 1 ? 'critical' : daysUntil <= 7 ? 'routine' : 'scheduled';
                        
                        return (
                          <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold">{item.unit || 'N/A'}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    priority === 'critical' ? 'bg-destructive/10 text-destructive' :
                                    priority === 'routine' ? 'bg-blue-500/10 text-blue-600' :
                                    'bg-emerald-500/10 text-emerald-600'
                                  }`}>
                                    {priority === 'critical' ? 'Critical' : priority === 'routine' ? 'Routine' : 'Scheduled'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.description || item.maintenance_type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground font-medium">
                                  {item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold ${daysUntil <= 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Wrench className="h-10 w-10" />}
                      title="No scheduled maintenance"
                      description="Schedule your first maintenance to keep your fleet running smoothly."
                    />
                  )}
                </div>
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Quick Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Scheduled</span>
                        <span className="font-bold">{scheduledItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due This Week</span>
                        <span className="font-bold">
                          {scheduledItems.filter(item => {
                            if (!item.scheduled_date) return false;
                            const days = Math.ceil((new Date(item.scheduled_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            return days >= 0 && days <= 7;
                          }).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overdue</span>
                        <span className="font-bold text-destructive">
                          {scheduledItems.filter(item => {
                            if (!item.scheduled_date) return false;
                            return new Date(item.scheduled_date) < new Date();
                          }).length}
                        </span>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setShowScheduleModal(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Maintenance
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setShowCalendar(true)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        View Calendar
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <main className="space-y-6">

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Create Maintenance</h2>
        <form onSubmit={createRecord} className="grid gap-3">
          <input
            className="input w-full"
            placeholder="Unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <input
            className="input w-full"
            type="number"
            placeholder="Cost"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
          />
          <input
            className="input w-full"
            type="date"
            value={form.occurredAt}
            onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
          />
          <textarea
            className="input w-full"
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="input w-full"
            type="file"
            onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0] || null })}
          />
          <button className="btn" disabled={creating}>
            {creating ? "Creating..." : "Create Maintenance"}
          </button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm text-slate">Maintenance Records</h2>
        {records.length === 0 && (
          <EmptyState
            icon={<Wrench className="h-10 w-10" />}
            title="No maintenance records"
            description="Create your first maintenance record to start tracking fleet service history."
          />
        )}
        {records.map((rec) => (
          <div key={rec.id} className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gold">{rec.unit || "Unit"}</div>
              <div className="text-xs text-slate">${rec.cost}</div>
            </div>
            {rec.description && <div className="text-xs text-slate">{rec.description}</div>}
            {rec.receipt_link ? (
              <a className="link text-xs" href={rec.receipt_link} target="_blank" rel="noreferrer">
                View receipt
              </a>
            ) : (
              <div className="text-xs text-slate">No receipt</div>
            )}
            <input
              className="input w-full"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadReceipt(rec.id, file);
              }}
              disabled={uploadingId === rec.id}
            />
          </div>
        ))}
      </section>
            </main>
          </TabsContent>
        </Tabs>
      </div>

      {showScheduleModal && (
        <ScheduleMaintenanceModal
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            fetchRecords();
            setShowScheduleModal(false);
          }}
          equipmentList={equipment}
        />
      )}
    </div>
  );
}
