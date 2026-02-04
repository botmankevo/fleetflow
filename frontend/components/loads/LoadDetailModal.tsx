'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, MapPin, Edit, Truck, DollarSign, Calendar, FileText, History, User, Building2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Timeline, TimelineStop } from '@/components/common/Timeline';
import { Load } from './LoadCard';
import { FileUploadZone } from '@/components/common/FileUploadZone';

interface LoadDetailModalProps {
  load: Load | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (load: Load) => void;
  onDispatch?: (load: Load) => void;
  className?: string;
}

type Tab = 'details' | 'documents' | 'billing' | 'history';

export function LoadDetailModal({
  load,
  isOpen,
  onClose,
  onEdit,
  onDispatch,
  className
}: LoadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');

  if (!isOpen || !load) return null;

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

  // Convert load stops to timeline format
  const timelineStops: TimelineStop[] = [
    {
      id: 1,
      type: 'pickup',
      location: load.pickup_location || 'Unknown',
      city: load.pickup_city,
      state: load.pickup_state,
      date: load.pickup_date,
      completed: ['delivered', 'in_transit', 'invoiced', 'paid'].includes(load.status),
      status: load.status === 'in_transit' ? 'completed' : load.status === 'new' ? 'pending' : 'completed',
      distance: load.total_miles,
      duration: load.total_miles ? Math.round(load.total_miles / 55 * 60) : undefined // Estimate at 55mph
    },
    {
      id: 2,
      type: 'delivery',
      location: load.delivery_location || 'Unknown',
      city: load.delivery_city,
      state: load.delivery_state,
      date: load.delivery_date,
      completed: ['delivered', 'invoiced', 'paid'].includes(load.status),
      status: load.status === 'delivered' ? 'completed' : load.status === 'in_transit' ? 'in_progress' : 'pending'
    }
  ];

  const tabs = [
    { id: 'details', label: 'Trip Info', icon: MapPin },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'billing', label: 'Billing', icon: DollarSign },
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
        'fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl shadow-2xl z-50',
        'animate-in slide-in-from-bottom-8 duration-300',
        'flex flex-col overflow-hidden',
        className
      )}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary font-bold text-xl">
              #{load.load_number}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Load #{load.load_number}
                </h2>
                <StatusBadge status={load.status} size="md" />
              </div>
              
              {load.broker_name && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {load.broker_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {load.status === 'new' && onDispatch && (
              <Button onClick={() => onDispatch(load)} className="gap-2">
                <Truck className="h-4 w-4" />
                Dispatch
              </Button>
            )}
            
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(load)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            
            <Button variant="ghost" onClick={onClose} size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all',
                  activeTab === tab.id
                    ? 'bg-white border-t border-x border-gray-200 text-primary font-semibold -mb-px'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Route Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route</h3>
                <Timeline 
                  stops={timelineStops} 
                  orientation="horizontal"
                  showDistance
                  showDuration
                />
              </div>

              {/* Three Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trip Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Trip Info
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Total Trip</p>
                      <p className="text-base font-semibold text-gray-900">
                        {load.total_miles ? `${load.total_miles} mi` : 'N/A'}
                      </p>
                    </div>
                    
                    {load.rate_per_mile && (
                      <div>
                        <p className="text-sm text-gray-500">Rate per Mile</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formatCurrency(load.rate_per_mile)}/mi
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-base font-semibold text-gray-900 capitalize">
                        {load.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Broker Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Broker
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-base font-semibold text-gray-900">
                        {load.broker_name || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Rate</p>
                      <p className="text-base font-semibold text-green-600">
                        {formatCurrency(load.broker_rate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Driver
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Driver</p>
                      <p className="text-base font-semibold text-gray-900">
                        {load.driver_name || 'Unassigned'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Truck/Trailer</p>
                      <p className="text-base font-semibold text-gray-900">
                        {load.truck_number 
                          ? `${load.truck_number} / ${load.trailer_number || 'N/A'}`
                          : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-900">{formatDate(load.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="text-gray-900">{formatDate(load.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
                <FileUploadZone
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  maxSize={10}
                  onChange={(files) => console.log('Files:', files)}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Documents</h3>
                <div className="text-center py-12 text-gray-500">
                  No documents uploaded yet
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Broker Rate</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(load.broker_rate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance</span>
                    <span className="font-semibold text-gray-900">
                      {load.total_miles} miles
                    </span>
                  </div>
                  {load.rate_per_mile && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per Mile</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(load.rate_per_mile)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(load.broker_rate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver's Payable</h3>
                <div className="text-center py-8 text-gray-500">
                  Driver payment details will appear here
                </div>
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
