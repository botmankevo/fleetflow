'use client';

import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadCard, Load, LoadListView, LoadFilters, LoadFilterValues, LoadDetailModal } from '@/components/loads';
import { StatsCard } from '@/components/common/StatsCard';

export default function LoadsPage() {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
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

  // Fetch loads from API
  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('fleetflow_token'); // Fixed: was 'token', should be 'fleetflow_token'
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/loads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API SUCCESS! Loaded', data.length, 'loads from API');
        console.log('First 3 loads:', data.slice(0, 3));
        setLoads(data);
      } else {
        console.error('❌ Failed to fetch loads:', response.status);
        alert('Failed to load: ' + response.status);
      }
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

  const handleEditLoad = (load: Load) => {
    // TODO: Open edit modal
    console.log('Edit load:', load);
  };

  const handleDispatchLoad = (load: Load) => {
    // TODO: Open dispatch modal
    console.log('Dispatch load:', load);
  };

  const handleCreateLoad = () => {
    // TODO: Implement full create load modal with form
    const loadNumber = `#${1000 + loads.length + 1}`;
    alert(`Creating new load ${loadNumber}\n\nThis will open a full form to enter:\n\n• Pickup & Delivery locations\n• Dates & times\n• Rate information\n• Customer/broker details\n• Equipment requirements\n\nFor now, you can see the 15 demo loads in the list!`);
    console.log('Create new load');
  };

  const handleExport = () => {
    // TODO: Export loads to CSV/Excel
    console.log('Export loads');
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loads</h1>
            <p className="text-gray-600 mt-1">
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
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
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
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
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
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-primary text-xs font-bold">
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
                <span className="text-sm text-gray-600">Active filters:</span>
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

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredLoads.length} of {loads.length} loads
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-gray-600">Loading loads...</p>
              </div>
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No loads found
                </h3>
                <p className="text-gray-600 mb-4">
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
              {filteredLoads.map(load => (
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
              loads={filteredLoads}
              onRowClick={handleLoadClick}
              onEdit={handleEditLoad}
              onDispatch={handleDispatchLoad}
            />
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
    </div>
  );
}
