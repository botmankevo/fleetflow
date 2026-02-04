import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type LoadStatus = 
  | 'draft' 
  | 'new' 
  | 'dispatched' 
  | 'in_transit' 
  | 'delivered' 
  | 'invoiced' 
  | 'paid'
  | 'cancelled';

export type DriverStatus = 'active' | 'inactive' | 'on_trip' | 'available';
export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing';

interface StatusBadgeProps {
  status: LoadStatus | DriverStatus | DocumentStatus | string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  // Load statuses
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-500',
    icon: '📝',
    pulse: false
  },
  new: {
    label: 'New',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    dotColor: 'bg-blue-500',
    icon: '🆕',
    pulse: false
  },
  dispatched: {
    label: 'Dispatched',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    dotColor: 'bg-indigo-500',
    icon: '📋',
    pulse: false
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    dotColor: 'bg-yellow-500',
    icon: '🚛',
    pulse: true
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500',
    icon: '✅',
    pulse: false
  },
  invoiced: {
    label: 'Invoiced',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: '💰',
    pulse: false
  },
  paid: {
    label: 'Paid',
    color: 'bg-teal-100 text-teal-700 border-teal-300',
    dotColor: 'bg-teal-500',
    icon: '✔️',
    pulse: false
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700 border-red-300',
    dotColor: 'bg-red-500',
    icon: '❌',
    pulse: false
  },
  
  // Driver statuses
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500',
    icon: '✅',
    pulse: false
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-500',
    icon: '⏸️',
    pulse: false
  },
  on_trip: {
    label: 'On Trip',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    dotColor: 'bg-blue-500',
    icon: '🚛',
    pulse: true
  },
  available: {
    label: 'Available',
    color: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500',
    icon: '✅',
    pulse: false
  },
  
  // Document statuses
  valid: {
    label: 'Valid',
    color: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500',
    icon: '✅',
    pulse: false
  },
  expiring_soon: {
    label: 'Expiring Soon',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    dotColor: 'bg-orange-500',
    icon: '⚠️',
    pulse: true
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-700 border-red-300',
    dotColor: 'bg-red-500',
    icon: '❌',
    pulse: false
  },
  missing: {
    label: 'Missing',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-500',
    icon: '❓',
    pulse: false
  }
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5'
};

export function StatusBadge({ 
  status, 
  animated = true, 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || {
    label: status,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-500',
    icon: '',
    pulse: false
  };

  const shouldPulse = animated && config.pulse;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {shouldPulse && (
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            config.dotColor
          )} />
        )}
        <span className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          config.dotColor
        )} />
      </span>
      <span>{config.label}</span>
    </div>
  );
}

export default StatusBadge;
