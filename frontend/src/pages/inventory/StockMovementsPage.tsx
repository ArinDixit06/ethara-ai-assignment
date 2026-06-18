import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Download,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import inventoryApi from '../../api/inventory.api';
import productsApi from '../../api/products.api';
import { StockMovement, MovementType } from '../../types/inventory.types';
import { Product } from '../../types/product.types';
import { formatDateTime } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const StockMovementsPage: React.FC = () => {
  // Filters local states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedType, setSelectedType] = useState<MovementType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // 1. Fetch historical movements with current filters
  const queryParams = {
    page: page + 1,
    limit: pageSize,
    productId: selectedProductId || undefined,
    type: selectedType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const {
    data: movementsData,
    isLoading: isMovementsLoading,
    isError: isMovementsError,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ['stock-movements-history', queryParams],
    queryFn: () => inventoryApi.getMovements(queryParams),
  });

  // 2. Fetch list of products to populate search dropdown
  const { data: productsRes } = useQuery({
    queryKey: ['products-dropdown-list'],
    queryFn: () => productsApi.getAll({ limit: 100 }),
  });
  const products: Product[] = productsRes?.data || [];

  // Export CSV handler
  const handleExportMovementsCSV = async () => {
    try {
      const blob = await inventoryApi.exportMovementsCSV({
        productId: selectedProductId || undefined,
        type: selectedType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Stock movements exported successfully');
    } catch (e) {
      toast.error('Failed to export stock movements to CSV');
    }
  };

  const handleClearFilters = () => {
    setSelectedProductId('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
  };

  // Define table columns
  const columns: ColumnDef<StockMovement>[] = [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Date & Time',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.product.name}</span>,
    },
    {
      id: 'sku',
      header: 'SKU',
      cell: ({ row }) => <code className="text-xs bg-slate-150 text-muted-foreground px-1.5 py-0.5 rounded font-mono">{row.original.product.sku}</code>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const move = row.original;
        const isPositive = move.type === 'INBOUND';
        const isAdjustment = move.type === 'ADJUSTMENT';
        return (
          <span className={`font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : isAdjustment ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-450'}`}>
            {isPositive ? '+' : isAdjustment ? '' : '-'}{move.quantity}
          </span>
        );
      },
    },
    {
      accessorKey: 'previousStock',
      header: 'Prev Stock',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.previousStock}</span>,
    },
    {
      accessorKey: 'newStock',
      header: 'New Stock',
      cell: ({ row }) => <span className="font-semibold">{row.original.newStock}</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
    },
    {
      id: 'referenceId',
      header: 'Reference #',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.referenceId || '-'}</span>,
    },
    {
      id: 'user',
      header: 'Performed By',
      cell: ({ row }) => <span>{row.original.createdBy.name}</span>,
    },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 text-foreground text-left w-full min-h-full">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Audit log of all stock adjustments, order receptions, and order fulfillments</p>
        </div>

        <button
          onClick={handleExportMovementsCSV}
          className="inline-flex items-center justify-center gap-1.5 border border-input bg-card text-foreground hover:bg-muted rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Movements CSV
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Movement Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Select Product */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
              Filter by Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-colors"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Type */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
              Filter by Movement Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-background border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-colors"
            >
              <option value="">All Types</option>
              <option value="INBOUND">Inbound</option>
              <option value="OUTBOUND">Outbound</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Movements DataTable Grid */}
      {isMovementsError ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Failed to load movement history</h3>
          <p className="text-sm text-muted-foreground mb-6">There was an issue fetching the stock movements logs from the server.</p>
          <button
            onClick={() => refetchMovements()}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/95 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={movementsData?.data || []}
          isLoading={isMovementsLoading}
          serverPagination={{
            pageIndex: page,
            pageSize: pageSize,
            pageCount: movementsData?.meta?.totalPages || 0,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      )}
    </div>
  );
};

export default StockMovementsPage;
