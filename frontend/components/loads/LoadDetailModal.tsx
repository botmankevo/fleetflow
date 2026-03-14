'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, MapPin, Edit, Truck, DollarSign, Calendar, FileText, History, User, Building2, Package, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Timeline, TimelineStop } from '@/components/common/Timeline';
import { Load } from './LoadCard';
import { FileUploadZone } from '@/components/common/FileUploadZone';
import { apiFetch, getToken, API_BASE } from '@/lib/api';
import { getRPMColorClass, FinancialSettings } from '@/lib/financials';

interface LoadDetailModalProps {
  load: Load | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (load: Load) => void;
  onDispatch?: (load: Load) => void;
  className?: string;
  settings?: FinancialSettings;
}

type Tab = 'details' | 'documents' | 'financials' | 'history';

export function LoadDetailModal({
  load,
  isOpen,
  onClose,
  onEdit,
  onDispatch,
  className,
  settings
}: LoadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Load>>(load || {});

  // Update editedData when load changes
  React.useEffect(() => {
    if (load) setEditedData(load);
  }, [load]);

  if (!isOpen || !load) return null;

  const handleFieldChange = (field: keyof Load, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!load) return;
    setIsSaving(true);
    try {
      await apiFetch(`/loads/${load.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editedData),
      });
      // Optionally show a toast success message here
      // fetchLoads() will be called by the parent if needed, 
      // but for now we'll just update the local state or reload
      // window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptimize = async () => {
    if (!load) return;
    setIsOptimizing(true);
    try {
      await apiFetch(`/loads/${load.id}/optimize-route`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRecalculate = async () => {
    if (!load) return;
    setIsRecalculating(true);
    try {
      await apiFetch(`/loads/${load.id}/recalculate-metrics`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRPMColor = (rpm: number) => {
    return getRPMColorClass(rpm, settings);
  };

  const getDriverPayDetails = () => {
    if (!load?.driver?.pay_profile) {
      // Fallback estimate if no profile exists
      return { 
        base: (load?.broker_rate || load?.rate_amount || 0) * 0.8, 
        description: 'Estimated Base (80%)',
        isEstimate: true
      };
    }
    
    const profile = load.driver.pay_profile;
    const baseFreight = load.broker_rate || load.rate_amount || 0;
    const miles = load.total_miles || 0;
    
    let base = 0;
    let description = '';
    
    if (profile.pay_type === 'percent') {
      base = baseFreight * (profile.rate / 100);
      description = `Freight % (${profile.rate}%)`;
    } else if (profile.pay_type === 'per_mile') {
      base = miles * profile.rate;
      description = `Mileage Pay (${miles} mi @ ${formatCurrency(profile.rate)}/mi)`;
    } else if (profile.pay_type === 'flat') {
      base = profile.rate;
      description = `Flat Pay Rate`;
    }
    
    return { base, description, isEstimate: false };
  };

  const driverPay = getDriverPayDetails();
  const driverFsc = load.fuel_surcharge || 0;
  const driverAccessorials = (load.detention ?? 0) + (load.layover ?? 0) + (load.lumper ?? 0) + (load.other_fees ?? 0);
  const totalDriverSettlement = driverPay.base + driverFsc + driverAccessorials;

  // Convert load stops to timeline format
  const timelineStops: TimelineStop[] = [
    {
      id: 1,
      type: 'pickup' as const,
      location: load.pickup_location || 'Origin',
      city: load.pickup_city || undefined,
      state: load.pickup_state || undefined,
      date: load.pickup_date || undefined,
      completed: ['delivered', 'in_transit', 'invoiced', 'paid'].includes(load.status),
      status: (load.status === 'in_transit' ? 'completed' : load.status === 'new' ? 'pending' : 'completed') as any,
    },
    // Intermediate stops
    ...(load.stops || [])
      .sort((a, b) => a.stop_number - b.stop_number)
      .map((stop, idx) => ({
        id: 10 + idx,
        type: 'stop' as const,
        location: stop.company || 'Intermediate Stop',
        city: stop.city || undefined,
        state: stop.state || undefined,
        date: stop.date || undefined,
        completed: ['delivered', 'invoiced', 'paid'].includes(load.status),
        status: (load.status === 'delivered' ? 'completed' : load.status === 'in_transit' ? 'in_progress' : 'pending') as any,
        distance: stop.miles_to_next_stop || undefined
      })),
    {
      id: 99,
      type: 'delivery' as const,
      location: load.delivery_location || 'Destination',
      city: load.delivery_city || undefined,
      state: load.delivery_state || undefined,
      date: load.delivery_date || undefined,
      completed: ['delivered', 'invoiced', 'paid'].includes(load.status),
      status: (load.status === 'delivered' ? 'completed' : load.status === 'in_transit' ? 'in_progress' : 'pending') as any
    }
  ];

  const tabs = [
    { id: 'details', label: 'Trip Info', icon: MapPin },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'fixed inset-2 md:inset-4 lg:inset-6 bg-white rounded-xl shadow-2xl z-50',
        'animate-in slide-in-from-bottom-4 duration-300',
        'flex flex-col overflow-hidden',
        className
      )}>
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-lg">
              #{editedData.load_number}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <input
                  value={editedData.load_number || ''}
                  onChange={(e) => handleFieldChange('load_number', e.target.value)}
                  className="text-xl font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-32"
                />
                <select
                  value={editedData.status || ''}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="text-xs font-medium px-2 py-1 rounded bg-gray-100 border-none focus:ring-0 uppercase"
                >
                  {['new', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {load.broker_name && (
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  {load.broker_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Zap className={cn("h-3 w-3", isOptimizing && "animate-pulse")} />
              {isOptimizing ? "Optimizing..." : "Optimize"}
            </Button>

            <Button variant="ghost" onClick={onClose} size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-gray-200 bg-white">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-t-lg transition-all text-xs',
                  activeTab === tab.id
                    ? 'bg-gray-50 border-t border-x border-gray-200 text-primary font-bold -mb-px'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gray-50/20">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Route Summary Cards (Compact) */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    Trip Timeline
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary font-bold">Map View</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-green-600 font-bold">Add Stop</Button>
                  </div>
                </div>
                <Timeline
                  stops={timelineStops}
                  orientation="horizontal"
                  showDistance
                />
              </div>

              {/* Main Grid - 4 Columns for High Density */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Status & Basic Info */}
                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-3">
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase">Status & Details</h4>
                   <div className="space-y-2">
                     <div>
                       <label className="text-[9px] text-gray-400 font-bold uppercase block">Current Status</label>
                       <select
                         value={editedData.status || ''}
                         onChange={(e) => handleFieldChange('status', e.target.value)}
                         className="w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                       >
                         {['new', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'cancelled'].map(s => (
                           <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>
                         ))}
                       </select>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 font-bold uppercase block">Billing Status</label>
                       <select
                         defaultValue="Pending"
                         className="w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                       >
                         <option>PENDING</option>
                         <option>INVOICED</option>
                         <option>PAID</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 font-bold uppercase block">Load Type</label>
                       <select
                         value={editedData.load_type || 'Full'}
                         onChange={(e) => handleFieldChange('load_type', e.target.value)}
                         className="w-full text-xs font-bold text-blue-800 bg-transparent border-none p-0 focus:ring-0"
                       >
                         <option value="Full">FULL LOAD</option>
                         <option value="Partial">PARTIAL</option>
                       </select>
                     </div>
                   </div>
                </div>

                {/* Trip Metrics */}
                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-3">
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase">Trip Metrics</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-400 font-medium">Total mi:</span>
                       <input
                         type="number"
                         value={editedData.total_miles || 0}
                         onChange={(e) => handleFieldChange('total_miles', parseFloat(e.target.value))}
                         className="w-16 text-right font-bold bg-gray-50 rounded px-1 border-none focus:ring-1 focus:ring-primary h-5"
                       />
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-400 font-medium">Empty mi:</span>
                       <input
                         type="number"
                         value={editedData.deadhead_miles || 0}
                         onChange={(e) => handleFieldChange('deadhead_miles', parseFloat(e.target.value))}
                         className="w-16 text-right font-bold bg-gray-50 rounded px-1 border-none focus:ring-1 focus:ring-primary h-5 text-amber-600"
                       />
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-400 font-medium">Rate / mi:</span>
                       <div className={cn("font-bold", getRPMColor(editedData.rate_per_mile || 0))}>
                         ${(editedData.rate_per_mile || 0).toFixed(2)}
                       </div>
                     </div>
                   </div>
                </div>

                {/* Broker/PO */}
                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-3">
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase">Broker</h4>
                   <div className="space-y-2">
                     <div>
                       <label className="text-[9px] text-gray-400 font-bold uppercase block">Name</label>
                       <input
                         value={editedData.broker_name || ''}
                         onChange={(e) => handleFieldChange('broker_name', e.target.value)}
                         className="w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                         placeholder="N/A"
                       />
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 font-bold uppercase block">PO Number</label>
                       <input
                         value={editedData.po_number || ''}
                         onChange={(e) => handleFieldChange('po_number', e.target.value)}
                         className="w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                         placeholder="N/A"
                       />
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-400 font-medium">Gross Rate:</span>
                       <div className="flex items-center gap-0.5 font-bold text-emerald-600">
                         <span>$</span>
                         <input
                           type="number"
                           value={editedData.broker_rate || 0}
                           onChange={(e) => handleFieldChange('broker_rate', parseFloat(e.target.value))}
                           className="w-20 text-right font-bold bg-transparent border-none p-0 focus:ring-0 h-4"
                         />
                       </div>
                     </div>
                   </div>
                </div>

                {/* Assignment */}
                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-3">
                   <h4 className="text-[10px] font-extrabold text-gray-400 uppercase">Assignment</h4>
                   <div className="space-y-2">
                     <div>
                       <label className="text-[9px] text-gray-400 font-bold uppercase block">Driver</label>
                       <p className="text-xs font-bold text-indigo-600 truncate">{editedData.driver_name || 'UNASSIGNED'}</p>
                     </div>
                     <div className="flex gap-2">
                       <div className="flex-1">
                         <label className="text-[9px] text-gray-400 font-bold uppercase block">Truck</label>
                         <input
                           value={editedData.truck_number || ''}
                           onChange={(e) => handleFieldChange('truck_number', e.target.value)}
                           className="w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                           placeholder="T#"
                         />
                       </div>
                       <div className="flex-1">
                         <label className="text-[9px] text-gray-400 font-bold uppercase block">Trailer</label>
                         <input
                           value={editedData.trailer_number || ''}
                           onChange={(e) => handleFieldChange('trailer_number', e.target.value)}
                           className="w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                           placeholder="Trl#"
                         />
                       </div>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Driver Pay:</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(totalDriverSettlement)}</span>
                     </div>
                   </div>
                </div>
              </div>

              {/* Secondary Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                 <div className="bg-white/50 p-2 rounded-lg border border-gray-100 space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase block">Weight (lbs)</label>
                    <input
                      type="number"
                      value={editedData.weight || 0}
                      onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value))}
                      className="w-full text-xs font-bold bg-transparent border-none p-0 focus:ring-0"
                    />
                 </div>
                 <div className="bg-white/50 p-2 rounded-lg border border-gray-100 space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase block">Pallets</label>
                    <input
                      type="number"
                      value={editedData.pallets || 0}
                      onChange={(e) => handleFieldChange('pallets', parseInt(e.target.value))}
                      className="w-full text-xs font-bold bg-transparent border-none p-0 focus:ring-0"
                    />
                 </div>
                 <div className="bg-white/50 p-2 rounded-lg border border-gray-100 space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase block">Length (ft)</label>
                    <input
                      type="number"
                      value={editedData.length_ft || 0}
                      onChange={(e) => handleFieldChange('length_ft', parseFloat(e.target.value))}
                      className="w-full text-xs font-bold bg-transparent border-none p-0 focus:ring-0"
                    />
                 </div>
                 <div className="bg-white/50 p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold uppercase block">Created</label>
                      <p className="text-[10px] font-medium text-gray-600">{formatDate(load.created_at)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRecalculate}
                      disabled={isRecalculating}
                      className="h-6 w-6 p-0"
                    >
                      <RefreshCw className={cn("h-3 w-3", isRecalculating && "animate-spin text-primary")} />
                    </Button>
                 </div>
              </div>

              {/* Notes Area */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative">
                 <h4 className="text-[10px] font-extrabold text-gray-400 uppercase mb-2 flex items-center justify-between">
                    Notes
                    <Button variant="ghost" size="sm" className="h-5 text-[9px] text-primary font-bold px-1 bg-primary/5">New Note</Button>
                 </h4>
                 <textarea
                    value={editedData.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    className="w-full text-xs font-medium text-gray-600 bg-gray-50/50 rounded-lg p-3 border-none focus:ring-1 focus:ring-primary/20 min-h-[80px] resize-none"
                    placeholder="Enter load notes, requirements, or instructions..."
                 />
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Upload Documents</h3>
                <FileUploadZone
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  maxSize={10}
                  onChange={(files) => console.log('Files:', files)}
                />
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Existing Documents</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {editedData.rc_document ? (
                    <div className="group relative bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-primary transition-all cursor-pointer">
                      <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-red-500 mb-2" />
                        <span className="text-[10px] font-bold text-gray-900 text-center truncate w-full">Rate Confirmation</span>
                        <span className="text-[8px] text-gray-500 mt-0.5">PDF Document</span>
                      </div>
                      <a 
                        href={editedData.rc_document.startsWith('http') ? editedData.rc_document : `${API_BASE.replace('/api/v1', '')}/uploads/${editedData.rc_document.split('/').pop()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                      />
                    </div>
                  ) : (
                    <div className="col-span-full py-12 text-center text-gray-400 text-xs italic">
                      No documents available for this load
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Revenue Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Base Rate</span>
                      <div className="flex items-center gap-1 font-bold text-gray-900">
                        <span>$</span>
                        <input
                          type="number"
                          value={editedData.broker_rate || 0}
                          onChange={(e) => handleFieldChange('broker_rate', parseFloat(e.target.value))}
                          className="bg-gray-50 border-none rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 w-24 text-right"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Fuel Surcharge</span>
                      <div className="flex items-center gap-1 font-bold text-gray-900">
                        <span>$</span>
                        <input
                          type="number"
                          value={editedData.fuel_surcharge || 0}
                          onChange={(e) => handleFieldChange('fuel_surcharge', parseFloat(e.target.value))}
                          className="bg-gray-50 border-none rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 w-24 text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accessorials</p>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Detention</span>
                        <div className="flex items-center gap-1 font-bold">
                          <span>$</span>
                          <input
                            type="number"
                            value={editedData.detention || 0}
                            onChange={(e) => handleFieldChange('detention', parseFloat(e.target.value))}
                            className="bg-gray-50 border-none rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 w-24 text-right"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Layover</span>
                        <div className="flex items-center gap-1 font-bold">
                          <span>$</span>
                          <input
                            type="number"
                            value={editedData.layover || 0}
                            onChange={(e) => handleFieldChange('layover', parseFloat(e.target.value))}
                            className="bg-gray-50 border-none rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 w-24 text-right"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Lumper</span>
                        <div className="flex items-center gap-1 font-bold">
                          <span>$</span>
                          <input
                            type="number"
                            value={editedData.lumper || 0}
                            onChange={(e) => handleFieldChange('lumper', parseFloat(e.target.value))}
                            className="bg-gray-50 border-none rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 w-24 text-right"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Other Fees</span>
                        <div className="flex items-center gap-1 font-bold">
                          <span>$</span>
                          <input
                            type="number"
                            value={editedData.other_fees || 0}
                            onChange={(e) => handleFieldChange('other_fees', parseFloat(e.target.value))}
                            className="bg-gray-50 border-none rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 w-24 text-right"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t-2 border-emerald-100 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-sm">TOTAL REVENUE</span>
                        <span className="font-extrabold text-emerald-600 text-lg">
                          {formatCurrency(
                            (editedData.broker_rate || 0) + 
                            (editedData.fuel_surcharge || 0) + 
                            (editedData.detention || 0) + 
                            (editedData.layover || 0) + 
                            (editedData.lumper || 0) + 
                            (editedData.other_fees || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <User className="h-4 w-4 text-blue-600" />
                    Driver Settlement
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">
                        {driverPay.description}
                        {driverPay.isEstimate && <span className="ml-1 text-[8px] bg-amber-100 text-amber-700 px-1 rounded">EST</span>}
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(driverPay.base)}
                      </span>
                    </div>
                    {driverFsc > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Fuel Surcharge (100%)</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(driverFsc)}
                        </span>
                      </div>
                    )}
                    {driverAccessorials > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Accessorials & Reimbursements</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(driverAccessorials)}
                        </span>
                      </div>
                    )}
                    <div className="border-t-2 border-blue-100 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-sm">DRIVER PAY</span>
                        <span className="font-extrabold text-blue-600 text-lg">
                          {formatCurrency(totalDriverSettlement)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 italic">
                        * Estimates based on current driver pay profile. Final settlement may vary.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm italic">Factoring Eligible</h4>
                    <p className="text-xs text-indigo-700">Estimated payout: {formatCurrency((editedData.broker_rate || 0) * 0.97)} (after 3% fee)</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-white text-xs font-bold">
                  Submit to Factoring
                </Button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Load History</h3>

              <div className="space-y-3">
                {load.created_at && (
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Load Created</p>
                      <p className="text-sm text-gray-600">{formatDate(load.created_at)}</p>
                    </div>
                  </div>
                )}

                {load.updated_at && load.updated_at !== load.created_at && (
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Load Updated</p>
                      <p className="text-sm text-gray-600">{formatDate(load.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default LoadDetailModal;
