'use client';

import React from 'react';
import { FilterPanel, FilterOption } from '@/components/common/FilterPanel';

export interface LoadFilterValues {
  status?: string[];
  driver?: string;
  dateRange?: { start: string; end: string };
  broker?: string;
  search?: string;
}

interface LoadFiltersProps {
  values: LoadFilterValues;
  drivers?: { id: number; name: string }[];
  brokers?: { id: number; name: string }[];
  onChange: (filters: LoadFilterValues) => void;
  onClear: () => void;
  onApply?: () => void;
  className?: string;
}

export function LoadFilters({
  values,
  drivers = [],
  brokers = [],
  onChange,
  onClear,
  onApply,
  className
}: LoadFiltersProps) {
  const handleFilterChange = (id: string, value: any) => {
    onChange({
      ...values,
      [id]: value
    });
  };

  const filters: FilterOption[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'multiselect',
      value: values.status || [],
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'New', value: 'new' },
        { label: 'Dispatched', value: 'dispatched' },
        { label: 'In Transit', value: 'in_transit' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Invoiced', value: 'invoiced' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' }
      ]
    },
    {
      id: 'driver',
      label: 'Driver',
      type: 'select',
      value: values.driver || '',
      options: drivers.map(d => ({ label: d.name, value: String(d.id) }))
    },
    {
      id: 'broker',
      label: 'Broker/Customer',
      type: 'select',
      value: values.broker || '',
      options: brokers.map(b => ({ label: b.name, value: String(b.id) }))
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'daterange',
      value: values.dateRange || { start: '', end: '' }
    }
  ];

  return (
    <FilterPanel
      filters={filters}
      onChange={handleFilterChange}
      onClear={onClear}
      onApply={onApply}
      className={className}
    />
  );
}

export default LoadFilters;
