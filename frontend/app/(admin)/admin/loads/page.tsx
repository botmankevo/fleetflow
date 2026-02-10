'use client';

import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadCard, Load, LoadListView, LoadFilters, LoadFilterValues, LoadDetailModal } from '@/components/loads';
import { StatsCard } from '@/components/common/StatsCard';
import EnhancedCreateLoadModal from '@/components/loads/EnhancedCreateLoadModal';

export default function LoadsPage() {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list'); // Default to list view
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState<LoadFilterValues>({
    status: [],
    driver: '',
    broker: '',
    dateRange: { start: '', end: '' }
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch loads from API
  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('fleetflow_token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      
      // Fetch loads, drivers, brokers, and equipment in parallel
      const [loadsRes, driversRes, brokersRes, equipmentRes] = await Promise.all([
        fetch(`${apiBase}/loads`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []),
        fetch(`${apiBase}/drivers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []),
        fetch(`${apiBase}/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []),
        fetch(`${apiBase}/equipment`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : [])
      ]);
      
      console.log('✅ API SUCCESS! Loaded', loadsRes.length, 'loads from API');
      setLoads(loadsRes);
      setDrivers(driversRes);
      setBrokers(brokersRes.filter((c: any) => c.type === 'broker' || !c.type));
      setEquipment(equipmentRes);
    } catch (error) {
      console.error('Error fetching loads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter loads based on search and filters
  const filteredLoads = loads.filter(load => {
    // Search filter
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

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(load.status)) return false;
    }

    // Driver filter
    if (filters.driver) {
      if (String(load.driver_id) !== filters.driver) return false;
    }

    // Broker filter
    if (filters.broker) {
      // Assuming broker_id exists or we match by name
      if (!load.broker_name?.toLowerCase().includes(filters.broker.toLowerCase())) return false;
    }

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const pickupDate = load.pickup_date ? new Date(load.pickup_date) : null;
      
      if (filters.dateRange.start && pickupDate) {
        if (pickupDate < new Date(filters.dateRange.start)) return false;
      }
      
      if (filters.dateRange.end && pickupDate) {
        if (pickupDate > new Date(filters.dateRange.end)) return false;
      }
    }

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLoads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLoads = filteredLoads.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Calculate stats
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);

  const handleEditLoad = (load: Load) => {
    setEditingLoad(load);
    setShowEditModal(true);
  };

  const handleUpdateLoad = async (updatedData: any) => {
    if (!editingLoad) return;
    
    try {
      const token = localStorage.getItem('fleetflow_token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/loads/${editingLoad.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setEditingLoad(null);
        fetchLoads(); // Refresh the list
      } else {
        alert('Failed to update load');
      }
    } catch (error) {
      console.error('Error updating load:', error);
      alert('Error updating load');
    }
  };

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchingLoad, setDispatchingLoad] = useState<Load | null>(null);

  const handleDispatchLoad = (load: Load) => {
    setDispatchingLoad(load);
    setShowDispatchModal(true);
  };

  const handleDispatch = async (driverId: number, truckId?: number, trailerId?: number) => {
    if (!dispatchingLoad) return;
    
    try {
      const token = localStorage.getItem('fleetflow_token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/loads/${dispatchingLoad.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          truck_id: truckId,
          trailer_id: trailerId,
          status: 'dispatched'
        }),
      });
      
      if (response.ok) {
        setShowDispatchModal(false);
        setDispatchingLoad(null);
        fetchLoads(); // Refresh the list
      } else {
        alert('Failed to dispatch load');
      }
    } catch (error) {
      console.error('Error dispatching load:', error);
      alert('Error dispatching load');
    }
  };

  const [showCreateLoadModal, setShowCreateLoadModal] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [newLoadData, setNewLoadData] = useState({
    load_number: '',
    pickup_location: '',
    delivery_location: '',
    pickup_date: '',
    delivery_date: '',
    broker_rate: '',
  });

  const handleCreateLoad = () => {
    setShowCreateLoadModal(true);
  };

  const handleSubmitNewLoad = async () => {
    try {
      const token = localStorage.getItem('fleetflow_token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/loads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLoadData,
          broker_rate: parseFloat(newLoadData.broker_rate) || 0,
          status: 'new',
        }),
      });
      
      if (response.ok) {
        setShowCreateLoadModal(false);
        setNewLoadData({
          load_number: '',
          pickup_location: '',
          delivery_location: '',
          pickup_date: '',
          delivery_date: '',
          broker_rate: '',
        });
        fetchLoads();
      } else {
        alert('Failed to create load');
      }
    } catch (error) {
      console.error('Error creating load:', error);
      alert('Error creating load');
    }
  };

  const handleExport = () => {
    // Export filtered loads to CSV
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
      driver: '',
      broker: '',
      dateRange: { start: '', end: '' }
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loads</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your freight loads
            </p>
          </div>
          
          <Button onClick={handleCreateLoad} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="h-5 w-5" />
            New Load
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard
          title="Total Loads"
          value={stats.total}
          color="blue"
          description="All time"
        />
        <StatsCard
          title="New Loads"
          value={stats.new}
          color="indigo"
          description="Awaiting dispatch"
        />
        <StatsCard
          title="In Transit"
          value={stats.inTransit}
          color="yellow"
          description="Currently moving"
        />
        <StatsCard
          title="Delivered"
          value={stats.delivered}
          color="green"
          description="This month"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
          color="purple"
          description="This month"
        />
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <LoadFilters
              values={filters}
              onChange={setFilters}
              onClear={handleClearFilters}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="bg-card rounded-lg border border p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search by load #, broker, driver, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 border border rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
              </div>

              {/* Filter Toggle */}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.status?.length || 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-card text-primary text-xs font-bold">
                    {filters.status?.length || 0}
                  </span>
                )}
              </Button>

              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchLoads}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Active Filters Display */}
            {(filters.status?.length || 0) > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {filters.status?.map(status => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      {status}
                      <button
                        onClick={() => {
                          setFilters({
                            ...filters,
                            status: filters.status?.filter(s => s !== status)
                          });
                        }}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Count & Pagination Controls */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredLoads.length)} of {filteredLoads.length} loads
              {filteredLoads.length !== loads.length && ` (filtered from ${loads.length} total)`}
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={filteredLoads.length}>All</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-card rounded-lg border border">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading loads...</p>
              </div>
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-lg border border">
              <div className="text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No loads found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || (filters.status?.length || 0) > 0
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first load'}
                </p>
                {!searchQuery && (filters.status?.length || 0) === 0 && (
                  <Button onClick={handleCreateLoad} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Load
                  </Button>
                )}
              </div>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedLoads.map(load => (
                <LoadCard
                  key={load.id}
                  load={load}
                  onClick={handleLoadClick}
                  onEdit={handleEditLoad}
                  onDispatch={handleDispatchLoad}
                />
              ))}
            </div>
          ) : (
            <LoadListView
              loads={paginatedLoads}
              onRowClick={handleLoadClick}
              onEdit={handleEditLoad}
              onDispatch={handleDispatchLoad}
            />
          )}
          
          {/* Pagination Controls */}
          {filteredLoads.length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Load Detail Modal */}
      <LoadDetailModal
        load={selectedLoad}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLoad(null);
        }}
        onEdit={handleEditLoad}
        onDispatch={handleDispatchLoad}
      />

      {/* Create Load Modal */}
      <EnhancedCreateLoadModal
        isOpen={showCreateLoadModal}
        onClose={() => setShowCreateLoadModal(false)}
        onSuccess={() => {
          fetchLoads();
          setShowCreateLoadModal(false);
        }}
        drivers={drivers}
        brokers={brokers}
        equipment={equipment}
      />

      {/* Edit Load Modal */}
      {showEditModal && editingLoad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Edit Load #{editingLoad.load_number}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Broker Name</label>
                  <input
                    type="text"
                    defaultValue={editingLoad.broker_name || ''}
                    id="edit-broker-name"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Rate Amount ($)</label>
                  <input
                    type="number"
                    defaultValue={editingLoad.rate_amount || editingLoad.broker_rate || ''}
                    id="edit-rate-amount"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Pickup Address</label>
                <input
                  type="text"
                  defaultValue={editingLoad.pickup_address || ''}
                  id="edit-pickup-address"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Delivery Address</label>
                <input
                  type="text"
                  defaultValue={editingLoad.delivery_address || ''}
                  id="edit-delivery-address"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  defaultValue={editingLoad.status || 'new'}
                  id="edit-status"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                >
                  <option value="new">New</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                <textarea
                  defaultValue={editingLoad.notes || ''}
                  id="edit-notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updatedData = {
                    broker_name: (document.getElementById('edit-broker-name') as HTMLInputElement).value,
                    rate_amount: parseFloat((document.getElementById('edit-rate-amount') as HTMLInputElement).value) || 0,
                    pickup_address: (document.getElementById('edit-pickup-address') as HTMLInputElement).value,
                    delivery_address: (document.getElementById('edit-delivery-address') as HTMLInputElement).value,
                    status: (document.getElementById('edit-status') as HTMLSelectElement).value,
                    notes: (document.getElementById('edit-notes') as HTMLTextAreaElement).value,
                  };
                  handleUpdateLoad(updatedData);
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Load Modal */}
      {showDispatchModal && dispatchingLoad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDispatchModal(false)}>
          <div className="bg-card rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Dispatch Load #{dispatchingLoad.load_number}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Select Driver *</label>
                <select
                  id="dispatch-driver"
                  defaultValue={dispatchingLoad.driver_id || ''}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name || `${driver.first_name} ${driver.last_name}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Select Truck (Optional)</label>
                <select
                  id="dispatch-truck"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                >
                  <option value="">-- Select Truck --</option>
                  {equipment.filter(e => e.type === 'truck').map(truck => (
                    <option key={truck.id} value={truck.id}>
                      {truck.unit_number} - {truck.make} {truck.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Select Trailer (Optional)</label>
                <select
                  id="dispatch-trailer"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 text-foreground"
                >
                  <option value="">-- Select Trailer --</option>
                  {equipment.filter(e => e.type === 'trailer').map(trailer => (
                    <option key={trailer.id} value={trailer.id}>
                      {trailer.unit_number} - {trailer.make} {trailer.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const driverId = parseInt((document.getElementById('dispatch-driver') as HTMLSelectElement).value);
                  const truckId = (document.getElementById('dispatch-truck') as HTMLSelectElement).value;
                  const trailerId = (document.getElementById('dispatch-trailer') as HTMLSelectElement).value;
                  
                  if (!driverId) {
                    alert('Please select a driver');
                    return;
                  }
                  
                  handleDispatch(
                    driverId,
                    truckId ? parseInt(truckId) : undefined,
                    trailerId ? parseInt(trailerId) : undefined
                  );
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Dispatch Load
              </button>
            </div>
          </div>
        </div>
      )}

      {false && showCreateLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateLoadModal(false)}>
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Create New Load</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Load Number *</label>
                  <input
                    type="text"
                    value={newLoadData.load_number}
                    onChange={(e) => setNewLoadData({ ...newLoadData, load_number: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground"
                    placeholder="L-12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Broker Rate ($) *</label>
                  <input
                    type="number"
                    value={newLoadData.broker_rate}
                    onChange={(e) => setNewLoadData({ ...newLoadData, broker_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground"
                    placeholder="2500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Pickup Location *</label>
                <input
                  type="text"
                  value={newLoadData.pickup_location}
                  onChange={(e) => setNewLoadData({ ...newLoadData, pickup_location: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground"
                  placeholder="Los Angeles, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Delivery Location *</label>
                <input
                  type="text"
                  value={newLoadData.delivery_location}
                  onChange={(e) => setNewLoadData({ ...newLoadData, delivery_location: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground"
                  placeholder="Dallas, TX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Pickup Date *</label>
                  <input
                    type="date"
                    value={newLoadData.pickup_date}
                    onChange={(e) => setNewLoadData({ ...newLoadData, pickup_date: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    value={newLoadData.delivery_date}
                    onChange={(e) => setNewLoadData({ ...newLoadData, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateLoadModal(false)}
                className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNewLoad}
                disabled={!newLoadData.load_number || !newLoadData.pickup_location || !newLoadData.delivery_location}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
