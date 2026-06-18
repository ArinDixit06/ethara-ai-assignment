import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  Boxes,
  X,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  Lock,
  ShieldAlert,
  Send,
  CheckCircle2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import inventoryApi from '../../api/inventory.api';
import productsApi from '../../api/products.api';
import { Product, Category } from '../../types/product.types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePermissions } from '../../hooks/usePermissions';
import { useStockRequestStore } from '../../store/stockRequestStore';
import { useAuthStore } from '../../store/authStore';

type DrawerMode = 'adjust' | 'request';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { canAdjustStock, canRequestStockAdjust, isAdmin, isManager, isStaff, role } = usePermissions();
  const { user } = useAuthStore();
  const { addRequest } = useStockRequestStore();

  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'HEALTHY'>('ALL');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('adjust');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Shared form fields
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('Correction');
  const [notes, setNotes] = useState('');

  // Request submitted confirmation state
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // 1. Fetch inventory products
  const queryParams = {
    page: page + 1,
    limit: pageSize,
    search: search.trim() || undefined,
    categoryId: selectedCategoryId || undefined,
  };

  const {
    data: inventoryData,
    isLoading: isInventoryLoading,
    isError: isInventoryError,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ['inventory', queryParams],
    queryFn: () => inventoryApi.getInventory(queryParams),
  });

  // 2. Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  const items = inventoryData?.data || [];
  const allCount = items.length;
  const lowStockCount = items.filter(p => p.currentStock > 0 && p.currentStock <= p.reorderThreshold).length;
  const outOfStockCount = items.filter(p => p.currentStock === 0).length;
  const healthyCount = items.filter(p => p.currentStock > p.reorderThreshold).length;

  const filteredInventory = items.filter(p => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OUT_OF_STOCK') return p.currentStock === 0;
    if (statusFilter === 'LOW_STOCK') return p.currentStock > 0 && p.currentStock <= p.reorderThreshold;
    if (statusFilter === 'HEALTHY') return p.currentStock > p.reorderThreshold;
    return true;
  });

  // 3. Stock adjustment mutation (ADMIN only)
  const adjustMutation = useMutation({
    mutationFn: inventoryApi.adjustStock,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-notifications'] });
      toast.success(`Stock adjusted for ${res.product.name}. New quantity: ${res.product.currentStock}`);
      setIsDrawerOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to adjust stock level');
    },
  });

  const resetForm = () => {
    setQuantity(0);
    setAdjustmentType('ADD');
    setReason('Correction');
    setNotes('');
    setRequestSubmitted(false);
  };

  const handleOpenDrawer = (product: Product) => {
    setSelectedProduct(product);
    resetForm();
    if (canAdjustStock) {
      setDrawerMode('adjust');
    } else if (canRequestStockAdjust) {
      setDrawerMode('request');
    } else {
      toast.error('You do not have permission to perform or request stock adjustments.');
      return;
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity <= 0) {
      toast.error('Adjustment quantity must be greater than 0');
      return;
    }
    adjustMutation.mutate({
      productId: selectedProduct.id,
      type: adjustmentType,
      quantity,
      reason,
      notes: notes.trim() || undefined,
    });
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user) return;
    if (quantity <= 0) {
      toast.error('Requested quantity must be greater than 0');
      return;
    }

    addRequest({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productSku: selectedProduct.sku,
      currentStock: selectedProduct.currentStock,
      unitOfMeasure: selectedProduct.unitOfMeasure,
      adjustmentType,
      quantity,
      reason,
      notes: notes.trim() || undefined,
      requestedBy: user.name,
      requestedByRole: user.role,
    });

    setRequestSubmitted(true);
    toast.success('Stock adjustment request sent to admin!');
  };

  const getRowStockBgClass = (p: Product): string => {
    if (p.currentStock === 0) return 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-950 dark:text-rose-200';
    if (p.currentStock <= p.reorderThreshold) return 'bg-amber-500/5 hover:bg-amber-500/10 text-amber-950 dark:text-amber-250';
    return 'hover:bg-muted/40';
  };

  const getStockStatusLabel = (p: Product) => {
    if (p.currentStock === 0) return <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Out of Stock</span>;
    if (p.currentStock <= p.reorderThreshold) return <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Low Stock</span>;
    return <span className="text-xs text-emerald-600 dark:text-emerald-400">Healthy</span>;
  };

  const adjustTypeOptions = [
    { type: 'ADD', label: 'Add', icon: TrendingUp },
    { type: 'REMOVE', label: 'Remove', icon: TrendingDown },
    { type: 'SET', label: 'Set Total', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 text-foreground text-left relative w-full min-h-full">

      {/* Drawer Portal */}
      {selectedProduct && createPortal(
        <div className={`fixed inset-0 z-50 ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseDrawer}
          />

          {/* Slide-over Drawer */}
          <div
            className={`fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex flex-col h-full">

              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  {drawerMode === 'request' ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 border border-amber-200">
                      <Send className="w-4 h-4 text-amber-600" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 border border-slate-200">
                      <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {drawerMode === 'adjust' ? 'Adjust Stock Level' : 'Request Stock Adjustment'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{selectedProduct.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role banner for non-admins */}
              {drawerMode === 'request' && !requestSubmitted && (
                <div className="mx-6 mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Admin approval required.</span> As a{' '}
                    <span className="font-semibold capitalize">{role?.toLowerCase()}</span>, you cannot directly
                    adjust stock. Submit a request and an Admin will review and apply it.
                  </div>
                </div>
              )}

              {/* Current Stock info */}
              {!requestSubmitted && (
                <div className="mx-6 mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider">SKU</span>
                    <p className="font-mono mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{selectedProduct.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider">Current Stock</span>
                    <p className="font-bold mt-0.5 text-slate-900 dark:text-slate-100">
                      {selectedProduct.currentStock} {selectedProduct.unitOfMeasure}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Submitted Confirmation ── */}
              {requestSubmitted ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Request Sent!</h4>
                  <p className="text-sm text-slate-500 mb-1">
                    Your stock adjustment request for
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mb-4">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-400 mb-8">
                    An Admin will review and apply your request. You'll see the change reflected once approved.
                  </p>
                  <button
                    onClick={handleCloseDrawer}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* ── Form (shared for both modes) ── */
                <form
                  onSubmit={drawerMode === 'adjust' ? handleAdjustSubmit : handleRequestSubmit}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Adjustment Type */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Adjustment Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {adjustTypeOptions.map((btn) => {
                          const isSelected = adjustmentType === btn.type;
                          return (
                            <button
                              key={btn.type}
                              type="button"
                              onClick={() => setAdjustmentType(btn.type as any)}
                              className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <btn.icon className="w-3.5 h-3.5" />
                              <span>{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {drawerMode === 'request' ? 'Requested' : 'Adjustment'} Quantity ({selectedProduct.unitOfMeasure}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="0"
                        value={quantity || ''}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      />
                      {adjustmentType === 'SET' && (
                        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Info className="w-3 h-3" /> This will set the total stock to this exact number.
                        </p>
                      )}
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Reason *
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
                      >
                        <option value="Received goods">Received goods (Purchase)</option>
                        <option value="Damaged">Damaged / Damaged goods</option>
                        <option value="Sold">Sold / Sales fulfillment</option>
                        <option value="Correction">Audit Correction</option>
                        <option value="Other">Other reason</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Notes {drawerMode === 'request' ? '(visible to Admin)' : '(optional)'}
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Provide reference numbers, audit notes, or justification..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Panel */}
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={handleCloseDrawer}
                      className="inline-flex justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adjustMutation.isPending}
                      className={`inline-flex items-center gap-1.5 justify-center rounded-lg border border-transparent px-5 py-2 text-sm font-medium text-white shadow-sm focus:outline-none transition-colors disabled:opacity-50 cursor-pointer ${
                        drawerMode === 'request'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {drawerMode === 'request' ? (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          {adjustMutation.isPending ? 'Sending...' : 'Send Request to Admin'}
                        </>
                      ) : (
                        adjustMutation.isPending ? 'Saving...' : 'Apply Adjustment'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Main Page ── */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time stock audits, reservation logs, and inline adjustments</p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { key: 'ALL', label: 'All Products', count: allCount },
            { key: 'LOW_STOCK', label: 'Low Stock', count: lowStockCount },
            { key: 'OUT_OF_STOCK', label: 'Out of Stock', count: outOfStockCount },
            { key: 'HEALTHY', label: 'Healthy', count: healthyCount },
          ].map((pill) => {
            const isActive = statusFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setStatusFilter(pill.key as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pill.label}{' '}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 font-semibold'}`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search catalog by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/60 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="bg-background border border-input rounded-md text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => { setSearch(''); setSelectedCategoryId(''); }}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto md:ml-0"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      {isInventoryError ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Failed to load inventory log</h3>
          <p className="text-sm text-muted-foreground mb-6">There was an issue fetching the stocks levels from the server.</p>
          <button
            onClick={() => refetchInventory()}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/95 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto rounded-lg border border-border bg-card shadow-sm flex flex-col justify-between">
          <table className="w-full border-collapse text-left text-sm text-foreground">
            <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Current Stock</th>
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isInventoryLoading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, cIdx) => (
                      <td key={`skel-td-${cIdx}`} className="px-4 py-4">
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !inventoryData || filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No products matching the selected stock status.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((p) => {
                  const reserved = Math.floor(p.currentStock * 0.1);
                  const available = p.currentStock - reserved;
                  return (
                    <tr key={p.id} className={`transition-colors ${getRowStockBgClass(p)}`}>
                      <td className="px-4 py-3 font-semibold text-foreground truncate max-w-[200px]" title={p.name}>
                        {p.name}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                          {p.sku}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category?.name || 'Uncategorized'}</td>
                      <td className="px-4 py-3 text-right font-bold">{p.currentStock} {p.unitOfMeasure}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{reserved} {p.unitOfMeasure}</td>
                      <td className="px-4 py-3 text-right font-semibold">{available} {p.unitOfMeasure}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{p.reorderThreshold}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(p.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="mr-1.5">{getStockStatusLabel(p)}</span>
                          {canAdjustStock ? (
                            /* ADMIN: direct adjust button */
                            <button
                              onClick={() => handleOpenDrawer(p)}
                              className="inline-flex items-center justify-center gap-1 border border-primary text-primary hover:bg-primary/5 text-xs font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                              title="Adjust Stock"
                            >
                              <span>Adjust</span>
                            </button>
                          ) : canRequestStockAdjust ? (
                            /* MANAGER / STAFF: request button */
                            <button
                              onClick={() => handleOpenDrawer(p)}
                              className="inline-flex items-center justify-center gap-1 border border-amber-400 text-amber-700 hover:bg-amber-50 text-xs font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                              title="Request Stock Adjustment (Admin approval required)"
                            >
                              <Send className="w-3 h-3" />
                              <span>Request</span>
                            </button>
                          ) : (
                            /* Fallback: no access */
                            <button
                              disabled
                              className="inline-flex items-center justify-center gap-1 border border-slate-200 text-slate-400 bg-slate-50 text-xs font-semibold px-2.5 py-1 rounded cursor-not-allowed"
                              title="Insufficient permissions"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Adjust</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          {!isInventoryLoading && inventoryData && inventoryData.data.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {inventoryData.meta?.totalPages || 1}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="border border-input bg-card text-foreground px-3 py-1 rounded text-xs hover:bg-muted disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page + 1 >= (inventoryData.meta?.totalPages || 1)}
                  onClick={() => setPage(page + 1)}
                  className="border border-input bg-card text-foreground px-3 py-1 rounded text-xs hover:bg-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
