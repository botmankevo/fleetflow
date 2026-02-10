'use client';

import React, { useState } from 'react';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Load } from './LoadCard';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { DocumentUploadModal } from './DocumentUploadModal';

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
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    loadId: number;
    loadNumber: string;
    docType: string;
  } | null>(null);

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
      width: '160px',
      render: (value, row) => (
        <div className="max-w-[160px]">
          <p className="font-medium text-xs text-gray-900 truncate" title={value || 'N/A'}>
            {value || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {row.pickup_city}, {row.pickup_state}
          </p>
          {row.pickup_date && (
            <p className="text-[10px] text-blue-600 font-medium">
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
      width: '160px',
      render: (value, row) => (
        <div className="max-w-[160px]">
          <p className="font-medium text-xs text-gray-900 truncate" title={value || 'N/A'}>
            {value || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {row.delivery_city}, {row.delivery_state}
          </p>
          {row.delivery_date && (
            <p className="text-[10px] text-green-600 font-medium">
              {formatDate(row.delivery_date)}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'driver',
      label: 'Driver',
      sortable: true,
      width: '120px',
      render: (value, row) => (
        <span className="text-sm text-gray-700">
          {row.driver?.name || row.driver_name || <span className="text-gray-400 italic">Unassigned</span>}
        </span>
      )
    },
    {
      key: 'broker_rate',
      label: 'Rate',
      sortable: true,
      width: '100px',
      align: 'right',
      render: (value, row) => (
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">
            {formatCurrency(row.rate_amount || value)}
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
      width: '140px',
      render: (value, row) => (
        <span className="text-sm text-gray-700 truncate block max-w-[140px]" title={row.customer?.company_name || value || 'N/A'}>
          {row.customer?.company_name || value || 'N/A'}
        </span>
      )
    },
    {
      key: 'documents',
      label: 'Docs',
      width: '85px',
      align: 'center',
      render: (_, row) => {
        const docs = [
          { key: 'rc', label: 'RC', field: row.rc_document, title: 'Rate Confirmation' },
          { key: 'bol', label: 'BOL', field: row.bol_document, title: 'Bill of Lading' },
          { key: 'pod', label: 'POD', field: row.pod_document, title: 'Proof of Delivery' },
          { key: 'inv', label: 'INV', field: row.invoice_document, title: 'Invoice' },
          { key: 'rcpt', label: 'RCP', field: row.receipt_document, title: 'Receipt' },
          { key: 'other', label: 'OTH', field: row.other_document, title: 'Other' },
        ];
        
        return (
          <div className="grid grid-cols-3 gap-1 py-1" onClick={(e) => e.stopPropagation()}>
            {docs.map(doc => (
              <button
                key={doc.key}
                onClick={(e) => {
                  e.stopPropagation();
                  if (doc.field) {
                    window.open(doc.field, '_blank');
                  } else {
                    setUploadModal({
                      isOpen: true,
                      loadId: row.id,
                      loadNumber: row.load_number,
                      docType: doc.key.toUpperCase()
                    });
                  }
                }}
                className={`
                  w-6 h-6 rounded text-[9px] font-semibold flex items-center justify-center
                  transition-colors
                  ${doc.field 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' 
                    : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                  }
                `}
                title={doc.field ? `View ${doc.title}` : `Upload ${doc.title}`}
              >
                {doc.label}
              </button>
            ))}
          </div>
        );
      }
    }
  ];

  return (
    <>
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
      
      {uploadModal && (
        <DocumentUploadModal
          isOpen={uploadModal.isOpen}
          onClose={() => setUploadModal(null)}
          loadId={uploadModal.loadId}
          loadNumber={uploadModal.loadNumber}
          docType={uploadModal.docType}
          onSuccess={() => {
            // Refresh loads or update UI
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

export default LoadListView;
