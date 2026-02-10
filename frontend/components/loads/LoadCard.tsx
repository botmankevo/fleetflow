'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MapPin, Truck, User, DollarSign, Calendar, ArrowRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Load {
  id: number;
  load_number: string;
  status: string;
  broker_name?: string;
  broker_rate?: number;
  rate_amount?: number;
  driver_name?: string;
  driver_id?: number;
  driver?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    company_name: string;
    customer_type?: string;
  };
  truck_number?: string;
  trailer_number?: string;
  pickup_location?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_address?: string;
  pickup_date?: string;
  delivery_location?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_address?: string;
  delivery_date?: string;
  total_miles?: number;
  rate_per_mile?: number;
  notes?: string;
  po_number?: string;
  created_at?: string;
  updated_at?: string;
  // Document attachments
  rc_document?: string;
  bol_document?: string;
  pod_document?: string;
  invoice_document?: string;
  receipt_document?: string;
  other_document?: string;
}

interface LoadCardProps {
  load: Load;
  onClick?: (load: Load) => void;
  onEdit?: (load: Load) => void;
  onDispatch?: (load: Load) => void;
  onDelete?: (load: Load) => void;
  className?: string;
}

export function LoadCard({
  load,
  onClick,
  onEdit,
  onDispatch,
  onDelete,
  className
}: LoadCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(load);
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-all',
        'hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm">
            #
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              Load #{load.load_number}
            </h3>
            {load.broker_name && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {load.broker_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={load.status} />
          
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Route Timeline */}
      <div className="space-y-3 mb-4">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
            <MapPin className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-blue-600">PICKUP</span>
              {load.pickup_date && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(load.pickup_date)}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {load.pickup_location || 'No pickup location'}
            </p>
            {(load.pickup_city || load.pickup_state) && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {load.pickup_city}, {load.pickup_state}
              </p>
            )}
          </div>
        </div>

        {/* Arrow with miles */}
        <div className="flex items-center gap-2 pl-10">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <ArrowRight className="h-3 w-3" />
            {load.total_miles && (
              <span className="font-medium">{load.total_miles} mi</span>
            )}
          </div>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Delivery */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 flex-shrink-0">
            <MapPin className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-green-600">DELIVERY</span>
              {load.delivery_date && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(load.delivery_date)}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {load.delivery_location || 'No delivery location'}
            </p>
            {(load.delivery_city || load.delivery_state) && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {load.delivery_city}, {load.delivery_state}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
        {/* Driver */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Driver</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {load.driver_name || 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Truck/Trailer */}
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-400" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Equipment</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {load.truck_number ? `${load.truck_number}/${load.trailer_number || 'N/A'}` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Rate */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Broker Rate</p>
            <p className="text-sm font-medium text-green-600">
              {formatCurrency(load.broker_rate)}
            </p>
          </div>
        </div>

        {/* Rate per Mile */}
        {load.rate_per_mile && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Per Mile</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(load.rate_per_mile)}/mi
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Shown on hover */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {load.status === 'new' && onDispatch && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDispatch(load);
            }}
          >
            Dispatch
          </Button>
        )}
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(load);
            }}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}

export default LoadCard;

