'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'date' | 'daterange' | 'text' | 'multiselect';
  options?: { label: string; value: string }[];
  value?: any;
  placeholder?: string;
}

interface FilterPanelProps {
  filters: FilterOption[];
  onChange: (id: string, value: any) => void;
  onClear?: () => void;
  onApply?: () => void;
  className?: string;
}

export function FilterPanel({
  filters,
  onChange,
  onClear,
  onApply,
  className
}: FilterPanelProps) {
  const hasActiveFilters = filters.some(f => {
    if (Array.isArray(f.value)) return f.value.length > 0;
    return f.value !== undefined && f.value !== '' && f.value !== null;
  });

  const renderFilter = (filter: FilterOption) => {
    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
            value={filter.value || ''}
            onChange={(e) => onChange(filter.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => onChange(filter.id, e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => {
              const selectedValues = filter.value || [];
              const isSelected = selectedValues.includes(option.value);
              
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((v: string) => v !== option.value);
                      onChange(filter.id, newValues);
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={filter.value || ''}
            onChange={(e) => onChange(filter.id, e.target.value)}
          />
        );

      case 'daterange':
        return (
          <div className="space-y-2">
            <Input
              type="date"
              placeholder="Start date"
              value={filter.value?.start || ''}
              onChange={(e) => onChange(filter.id, {
                ...filter.value,
                start: e.target.value
              })}
            />
            <Input
              type="date"
              placeholder="End date"
              value={filter.value?.end || ''}
              onChange={(e) => onChange(filter.id, {
                ...filter.value,
                end: e.target.value
              })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('rounded-lg border bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
              Active
            </span>
          )}
        </div>
        
        {hasActiveFilters && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-600 hover:text-gray-900"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            {renderFilter(filter)}
          </div>
        ))}
      </div>

      {onApply && (
        <div className="mt-4 pt-4 border-t">
          <Button
            onClick={onApply}
            className="w-full"
            disabled={!hasActiveFilters}
          >
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
