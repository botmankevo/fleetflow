'use client';

import React from 'react';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Load } from './LoadCard';
import { Button } from '@/components/ui/button';
import { Edit, Truck, Eye } from 'lucide-react';

interface LoadListViewProps {
  loads: Load[];
  loading?: boolean;
  onRowClick?: (load: Load) => void;
  onEdit?: (load: Load) => void;
  onDispatch?: (load: Load) => void;
  className?: string;
}

export function LoadListView({
  loads,
  loading = false,
  onRowClick,
  onEdit,
  onDispatch,
  className
}: LoadListViewProps) {
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const columns: Column<Load>[] = [
    {
      key: 'load_number',
      label: 'Load #',
      sortable: true,
      width: '100px',
      render: (value) => (
        <span className="font-mono font-semibold text-primary">
          #{value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '140px',
      render: (value) => <StatusBadge status={value} size="sm" />
    },
    {
      key: 'pickup_location',
      label: 'Pickup',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-sm text-gray-900 truncate max-w-[200px]">
            {value || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">
            {row.pickup_city}, {row.pickup_state}
          </p>
          {row.pickup_date && (
            <p className="text-xs text-gray-400">
              {formatDate(row.pickup_date)}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'delivery_location',
      label: 'Delivery',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-sm text-gray-900 truncate max-w-[200px]">
            {value || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">
            {row.delivery_city}, {row.delivery_state}
          </p>
          {row.delivery_date && (
            <p className="text-xs text-gray-400">
              {formatDate(row.delivery_date)}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'driver_name',
      label: 'Driver',
      sortable: true,
      width: '150px',
      render: (value) => (
        <span className="text-sm text-gray-700">
          {value || <span className="text-gray-400">Unassigned</span>}
        </span>
      )
    },
    {
      key: 'truck_number',
      label: 'Truck',
      sortable: true,
      width: '100px',
      render: (value, row) => (
        <span className="text-sm text-gray-700">
          {value ? `${value}/${row.trailer_number || 'N/A'}` : 'N/A'}
        </span>
      )
    },
    {
      key: 'total_miles',
      label: 'Miles',
      sortable: true,
      width: '80px',
      align: 'right',
      render: (value) => (
        <span className="text-sm font-medium text-gray-900">
          {value ? `${value} mi` : 'N/A'}
        </span>
      )
    },
    {
      key: 'broker_rate',
      label: 'Rate',
      sortable: true,
      width: '120px',
      align: 'right',
      render: (value, row) => (
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">
            {formatCurrency(value)}
          </p>
          {row.rate_per_mile && (
            <p className="text-xs text-gray-500">
              {formatCurrency(row.rate_per_mile)}/mi
            </p>
          )}
        </div>
      )
    },
    {
      key: 'broker_name',
      label: 'Broker',
      sortable: true,
      width: '150px',
      render: (value) => (
        <span className="text-sm text-gray-700 truncate">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRowClick?.(row);
            }}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              title="Edit Load"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDispatch && row.status === 'new' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDispatch(row);
              }}
              title="Dispatch Load"
            >
              <Truck className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={loads}
      columns={columns}
      loading={loading}
      onRowClick={onRowClick}
      searchable={false}
      emptyMessage="No loads found. Create your first load to get started!"
      className={className}
      striped
      hoverable
    />
  );
}

export default LoadListView;
