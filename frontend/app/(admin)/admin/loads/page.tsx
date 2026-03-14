'use client';

import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Filter, Download, RefreshCw, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, API_BASE, getToken } from '@/lib/api';
import { LoadCard, Load, LoadListView, LoadDetailModal } from '@/components/loads';
import { LoadKanbanBoard } from '@/components/loads/LoadKanbanBoard';
import AICreateLoadModal from '@/components/AICreateLoadModal';
import { getFinancialSettings, FinancialSettings } from '@/lib/financials';
import { StatsCard } from '@/components/common/StatsCard';
import EnhancedCreateLoadModal from '@/components/loads/EnhancedCreateLoadModal';

type LoadFilterValues = {
  status: string[];
  customer: string[];
  driver: string;
  broker: string;
  dateRange: { start: string; end: string };
};

export default function LoadsPage() {
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'board'>('list'); 
  const [showFilters, setShowFilters] = useState(false);
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [filters, setFilters] = useState<LoadFilterValues>({
    status: [],
    customer: [],
    driver: '',
    broker: '',
    dateRange: { start: '', end: '' }
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [showCreateLoadModal, setShowCreateLoadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchingLoad, setDispatchingLoad] = useState<Load | null>(null);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const [loadsRes, settingsRes, driversRes, customersRes, equipmentRes] = await Promise.all([
        apiFetch('/loads'),
        getFinancialSettings(),
        apiFetch('/drivers'),
        apiFetch('/customers'),
        apiFetch('/equipment')
      ]);
      
      setLoads(loadsRes || []);
      setFinancialSettings(settingsRes);
      setDrivers(driversRes || []);
      setBrokers(customersRes?.map((c: any) => ({ id: c.id, name: c.company_name })) || []);
      setEquipment(equipmentRes || []);
    } catch (error) {
      console.error('Error fetching loads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoads = (loads || []).filter(load => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        load.load_number?.toLowerCase().includes(query) ||
        load.broker_name?.toLowerCase().includes(query) ||
        load.driver_name?.toLowerCase().includes(query) ||
        load.pickup_location?.toLowerCase().includes(query) ||
        load.delivery_location?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(load.status)) return false;
    }

    if (filters.driver) {
      if (String(load.driver_id) !== filters.driver) return false;
    }

    if (filters.broker) {
      if (!load.broker_name?.toLowerCase().includes(filters.broker.toLowerCase())) return false;
    }

    if (filters.dateRange?.start || filters.dateRange?.end) {
      const pickupDate = load.pickup_date ? new Date(load.pickup_date) : null;
      if (filters.dateRange.start && pickupDate && pickupDate < new Date(filters.dateRange.start)) return false;
      if (filters.dateRange.end && pickupDate && pickupDate > new Date(filters.dateRange.end)) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLoads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLoads = filteredLoads.slice(startIndex, endIndex);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const stats = {
    total: loads.length,
    new: loads.filter(l => l.status === 'new').length,
    inTransit: loads.filter(l => l.status === 'in_transit').length,
    delivered: loads.filter(l => l.status === 'delivered').length,
    totalRevenue: loads.reduce((sum, l) => sum + (l.broker_rate || 0), 0)
  };

  const handleLoadClick = (load: Load) => {
    setSelectedLoad(load);
    setShowDetailModal(true);
  };

  const handleEditLoad = (load: Load) => {
    setEditingLoad(load);
    setShowEditModal(true);
  };

  const handleDispatchLoad = (load: Load) => {
    setDispatchingLoad(load);
    setShowDispatchModal(true);
  };

  const handleDispatch = async (driverId: number, truckId?: number, trailerId?: number) => {
    if (!dispatchingLoad) return;
    try {
      await apiFetch(`/loads/${dispatchingLoad.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          driver_id: driverId,
          truck_id: truckId,
          trailer_id: trailerId,
          status: 'dispatched'
        }),
      });
      setShowDispatchModal(false);
      setDispatchingLoad(null);
      fetchLoads();
    } catch (error) {
      console.error('Error dispatching load:', error);
      alert('Error dispatching load');
    }
  };

  const handleExport = () => {
    const headers = ['Load #', 'Status', 'Broker', 'Driver', 'Pickup', 'Delivery', 'Rate', 'Created'];
    const rows = filteredLoads.map(load => [
      load.load_number || '',
      load.status || '',
      load.broker_name || '',
      load.driver_name || '',
      load.pickup_location || load.pickup_address || '',
      load.delivery_location || load.delivery_address || '',
      load.broker_rate ? `$${load.broker_rate}` : '',
      load.created_at ? new Date(load.created_at).toLocaleDateString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      customer: [],
      driver: '',
      broker: '',
      dateRange: { start: '', end: '' }
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loads</h1>
            <p className="text-muted-foreground mt-1">Manage and track all your freight loads</p>
          </div>
          <Button onClick={() => setShowCreateLoadModal(true)} size="lg" className="gap-2 shadow-lg">
            <Plus className="h-5 w-5" />
            New Load
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard title="Total Loads" value={stats.total} color="blue" description="All time" />
        <StatsCard title="New Loads" value={stats.new} color="indigo" description="Awaiting dispatch" />
        <StatsCard title="In Transit" value={stats.inTransit} color="yellow" description="Currently moving" />
        <StatsCard title="Delivered" value={stats.delivered} color="green" description="This month" />
        <StatsCard title="Total Revenue" value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`} color="purple" description="This month" />
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-card p-4 rounded-lg border border">
              <h3 className="font-semibold mb-4">Filters</h3>
              <Button onClick={handleClearFilters} variant="outline" className="w-full">Clear Filters</Button>
            </div>
          </div>
        )}

        <div className="flex-1">
          <div className="bg-card rounded-lg border p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button variant={viewMode === 'board' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('board')}><Columns className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('card')}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              </div>
              <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                <Filter className="h-4 w-4" />
                {filters.status.length > 0 && <span className="ml-1">{filters.status.length}</span>}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={fetchLoads}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 bg-card rounded-lg border">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-lg border text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold">No loads found</h3>
              <Button onClick={() => setShowCreateLoadModal(true)} className="mt-4">Create Load</Button>
            </div>
          ) : viewMode === 'board' ? (
            <LoadKanbanBoard settings={financialSettings} onRefresh={fetchLoads} onAIModalOpen={() => setShowAIModal(true)} />
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedLoads.map(load => (
                <LoadCard key={load.id} load={load} onClick={handleLoadClick} onEdit={handleEditLoad} onDispatch={handleDispatchLoad} settings={financialSettings || undefined} />
              ))}
            </div>
          ) : (
            <LoadListView loads={paginatedLoads} onRowClick={handleLoadClick} onEdit={handleEditLoad} onDispatch={handleDispatchLoad} />
          )}

          {viewMode !== 'board' && filteredLoads.length > itemsPerPage && (
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
              <span className="flex items-center px-4 text-sm">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</Button>
            </div>
          )}
        </div>
      </div>

      <AICreateLoadModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} onSuccess={fetchLoads} />
      
      <LoadDetailModal
        load={selectedLoad}
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedLoad(null); }}
        onEdit={handleEditLoad}
        onDispatch={handleDispatchLoad}
        settings={financialSettings || undefined}
      />

      <EnhancedCreateLoadModal
        isOpen={showCreateLoadModal}
        onClose={() => setShowCreateLoadModal(false)}
        onSuccess={() => { fetchLoads(); setShowCreateLoadModal(false); }}
        drivers={drivers}
        brokers={brokers}
        equipment={equipment}
      />

      <EnhancedCreateLoadModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingLoad(null); }}
        onSuccess={() => { fetchLoads(); setShowEditModal(false); setEditingLoad(null); }}
        drivers={drivers}
        brokers={brokers}
        equipment={equipment}
        editLoad={editingLoad}
      />

      {showDispatchModal && dispatchingLoad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDispatchModal(false)}>
          <div className="bg-card rounded-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Dispatch Load #{dispatchingLoad.load_number}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Driver *</label>
                <select id="dispatch-driver" defaultValue={dispatchingLoad.driver_id || ''} className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Truck</label>
                <select id="dispatch-truck" className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option value="">-- Select Truck --</option>
                  {equipment.filter(e => e.equipment_type === 'truck').map(e => <option key={e.id} value={e.id}>{e.identifier}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Trailer</label>
                <select id="dispatch-trailer" className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option value="">-- Select Trailer --</option>
                  {equipment.filter(e => e.equipment_type === 'trailer').map(e => <option key={e.id} value={e.id}>{e.identifier}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowDispatchModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => {
                const driverId = parseInt((document.getElementById('dispatch-driver') as HTMLSelectElement).value);
                const truckId = (document.getElementById('dispatch-truck') as HTMLSelectElement).value;
                const trailerId = (document.getElementById('dispatch-trailer') as HTMLSelectElement).value;
                if (!driverId) return alert('Select a driver');
                handleDispatch(driverId, truckId ? parseInt(truckId) : undefined, trailerId ? parseInt(trailerId) : undefined);
              }}>Dispatch</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
