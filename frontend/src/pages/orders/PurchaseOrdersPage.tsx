import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  Filter,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ordersApi from '../../api/orders.api';
import suppliersApi from '../../api/suppliers.api';
import { Order, OrderStatus } from '../../types/order.types';
import { Supplier } from '../../types/supplier.types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OrderForm from '../../components/forms/OrderForm';
import { usePermissions } from '../../hooks/usePermissions';

export const PurchaseOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { canCreatePurchaseOrder, canDeleteOrder } = usePermissions();

  // Route state preselection values (e.g. from Dashboard low stock reorder action)
  const preselected = location.state as { preselectedProductId: string; preselectedUnitCost: number } | null;

  // Local component states
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Cancel Order states
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Trigger form on mount if redirected with preselected product reorder
  useEffect(() => {
    if (preselected) {
      setIsFormOpen(true);
      // Clear location state after capturing it to avoid reopening on reload
      window.history.replaceState({}, document.title);
    }
  }, [preselected]);

  // 1. Fetch Purchase Orders list
  const queryParams = {
    page: page + 1,
    limit: pageSize,
    type: 'PURCHASE' as const,
    status: selectedStatus ? (selectedStatus as OrderStatus) : undefined,
    supplierId: selectedSupplierId || undefined,
  };

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['orders-purchase', queryParams],
    queryFn: () => ordersApi.getAll(queryParams),
  });

  // 2. Fetch Suppliers for Filter Dropdown
  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersApi.getAll({ limit: 100 }),
  });
  const suppliers: Supplier[] = suppliersRes?.data || [];

  // 3. Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-purchase'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Order cancelled successfully');
      setIsCancelDialogOpen(false);
      setOrderToCancel(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    },
  });

  const handleCancelClick = (o: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToCancel(o);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      cancelMutation.mutate(orderToCancel.id);
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus('');
    setSelectedSupplierId('');
  };

  // Define Columns
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'PO Number',
      cell: ({ row }) => <span className="font-semibold font-mono text-xs">{row.original.orderNumber}</span>,
    },
    {
      id: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => <span>{row.original.supplier?.name || '-'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created Date',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'expectedDate',
      header: 'Expected Date',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.expectedDate)}</span>,
    },
    {
      id: 'totalItems',
      header: 'Total Items',
      cell: ({ row }) => {
        // Fetch or mock total line items quantities sum
        const order = row.original;
        // In backend response order model, is there lineItems count or direct array?
        // Let's assume order.lineItems is available or fallback to a total count
        return <span>{order.lineItems?.length || 0} items</span>;
      },
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Value',
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.totalAmount)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const o = row.original;
        const canCancel = o.status === 'DRAFT' || o.status === 'CONFIRMED' || o.status === 'SHIPPED';
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/orders/${o.id}`)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="View Order Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canCreatePurchaseOrder && canCancel && (
              <button
                onClick={(e) => handleCancelClick(o, e)}
                className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Cancel Order"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
      size: 80,
    },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full min-h-full">
      {isFormOpen ? (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold">Draft Purchase Order</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Procure inventory stocks from cataloged suppliers</p>
            </div>
            <button
              onClick={() => {
                setIsFormOpen(false);
              }}
              className="rounded-md border border-input p-1 hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <OrderForm
            type="PURCHASE"
            preselectedProduct={preselected ? { productId: preselected.preselectedProductId, unitCost: preselected.preselectedUnitCost } : null}
            onSuccess={() => {
              setIsFormOpen(false);
              refetchOrders();
            }}
            onCancel={() => {
              setIsFormOpen(false);
            }}
          />
        </div>
      ) : (
        <>
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track and confirm procurements, receipting, and supplier bills</p>
            </div>
            
            <button
              onClick={() => {
                if (canCreatePurchaseOrder) {
                  setIsFormOpen(true);
                }
              }}
              disabled={!canCreatePurchaseOrder}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
                canCreatePurchaseOrder 
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              title={!canCreatePurchaseOrder ? "Creating Purchase Orders requires Admin/Manager role" : "Draft a new purchase order"}
            >
              {canCreatePurchaseOrder ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              Draft Purchase Order
            </button>
          </div>

          {/* Filtering Sections */}
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-center justify-end gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              {/* Supplier Dropdown */}
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-background border border-input rounded-md text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-background border border-input rounded-md text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="RECEIVED">Received (Completed)</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Table list */}
          {isOrdersError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border">
              <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Failed to load purchase orders</h3>
              <p className="text-sm text-muted-foreground mb-6">There was an issue fetching the orders list from the server.</p>
              <button
                onClick={() => refetchOrders()}
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/95 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={ordersData?.data || []}
              isLoading={isOrdersLoading}
              onRowClick={(o) => navigate(`/orders/${o.id}`)}
              serverPagination={{
                pageIndex: page,
                pageSize: pageSize,
                pageCount: ordersData?.meta?.totalPages || 0,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          )}

          {/* Cancellation Confirm Dialog */}
          <ConfirmDialog
            isOpen={isCancelDialogOpen}
            onClose={() => {
              setIsCancelDialogOpen(false);
              setOrderToCancel(null);
            }}
            onConfirm={handleConfirmCancel}
            title="Cancel Purchase Order?"
            description={`Are you sure you want to cancel ${orderToCancel?.orderNumber}? This will cancel all line items procurement, and the order will be permanently set as cancelled.`}
            isDestructive={true}
            confirmText="Cancel Order"
          />
        </>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
