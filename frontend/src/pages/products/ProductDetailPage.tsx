import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Calendar,
  Building2,
  CircleDollarSign,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import toast from 'react-hot-toast';
import productsApi from '../../api/products.api';
import inventoryApi from '../../api/inventory.api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductForm from '../../components/forms/ProductForm';
import { usePermissions } from '../../hooks/usePermissions';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageProducts } = usePermissions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 1. Fetch Product details
  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
  });

  // 2. Fetch stock movements for this product
  const {
    data: movementsData,
    isLoading: isMovementsLoading,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ['product-movements', id],
    queryFn: () => inventoryApi.getMovements({ productId: id!, limit: 100 }),
    enabled: !!id,
  });

  // 3. Delete/deactivate product mutation
  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Product deactivated successfully');
      navigate('/products');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate product');
    },
  });

  const handleConfirmDelete = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    refetchProduct();
    refetchMovements();
  };

  if (isProductLoading || isMovementsLoading) {
    return <LoadingSpinner size="lg" className="my-20" />;
  }

  if (isProductError || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border text-foreground">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Product Not Found</h3>
        <p className="text-sm text-muted-foreground mb-6">The product you are trying to view does not exist or has been deleted.</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-1.5 border border-input bg-card text-foreground px-4 py-2 rounded-md hover:bg-muted text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/95 text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const movements = movementsData?.data || [];
  const imageUrl = product.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}` : null;

  return (
    <div className="flex-1 flex flex-col space-y-6 text-foreground text-left w-full min-h-full">
      {/* Edit Form Modal Wrapper */}
      {isFormOpen ? (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold">Edit Product</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Modify information for SKU: {product.sku}</p>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="rounded-md border border-input p-1 hover:bg-muted text-muted-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          
          <ProductForm
            product={product}
            onSuccess={() => {
              setIsFormOpen(false);
              handleRefresh();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <>
          {/* Page Toolbar */}
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center justify-center gap-1.5 border border-input bg-card hover:bg-muted text-foreground rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Catalog
            </button>

            {canManageProducts && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Product
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={!product.isActive}
                  className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-750 text-white rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Deactivate Product
                </button>
              </div>
            )}
          </div>

          {/* Product Overview Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Card: Core Product Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
                {/* Image display */}
                <div className="w-full h-48 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="w-12 h-12 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge
                      status={
                        !product.isActive
                          ? 'INACTIVE'
                          : product.currentStock === 0
                            ? 'OUT_OF_STOCK'
                            : product.currentStock <= product.reorderThreshold
                              ? 'LOW_STOCK'
                              : 'ACTIVE'
                      }
                    />
                  </div>
                </div>

                {/* Identity header */}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{product.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    SKU:{' '}
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold text-foreground">
                      {product.sku}
                    </code>
                  </p>
                </div>

                {/* Pricing / Stock Summary metrics */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-border py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <CircleDollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Selling Price</p>
                      <p className="text-sm font-bold">{formatCurrency(product.unitPrice)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Cost Price</p>
                      <p className="text-sm font-bold">{formatCurrency(product.costPrice)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-foreground">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Current Stock</p>
                      <p className="text-sm font-bold">
                        {product.currentStock} {product.unitOfMeasure}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Threshold</p>
                      <p className="text-sm font-bold">
                        {product.reorderThreshold} {product.unitOfMeasure}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional parameters fields */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-semibold text-foreground">{product.category?.name || 'Uncategorized'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Added On</span>
                    <span className="font-semibold text-foreground">{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-semibold text-foreground">{formatDateTime(product.updatedAt)}</span>
                  </div>
                </div>

                {/* Description details */}
                {product.description && (
                  <div className="border-t border-border pt-4 text-xs space-y-1">
                    <span className="text-muted-foreground font-semibold">Description</span>
                    <p className="text-muted-foreground leading-relaxed bg-muted/30 rounded p-2 text-justify">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Suppliers List Card */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-muted-foreground/80" />
                  <span>Associated Suppliers ({product.suppliers.length})</span>
                </h4>
                
                <div className="space-y-2 text-xs">
                  {product.suppliers.length === 0 ? (
                    <p className="text-muted-foreground italic">No suppliers linked to this product.</p>
                  ) : (
                    product.suppliers.map((s) => (
                      <div
                        key={s.supplierId}
                        onClick={() => navigate(`/suppliers`)} // or detail if route supports
                        className="flex items-center justify-between p-2 border border-border/60 hover:bg-muted/40 rounded cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-foreground">{s.supplier.name}</span>
                        <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                          {s.supplier.contactPerson || 'Contact'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Card: Stock movement history table for this product */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
              <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-semibold">Stock Movement Log</h3>
                  <p className="text-xs text-muted-foreground">Historical records of inventory audits for this product</p>
                </div>
                <button
                  onClick={() => refetchMovements()}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                  title="Reload list"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                {movements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <Calendar className="w-10 h-10 opacity-30 mb-2" />
                    <p className="text-xs">No stock movements recorded for this product yet.</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Prev Stock</th>
                        <th className="py-2.5 px-3 text-right">New Stock</th>
                        <th className="py-2.5 px-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {movements.map((move: any) => {
                        return (
                          <tr key={move.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2 px-3 text-muted-foreground">{formatDateTime(move.createdAt)}</td>
                            <td className="py-2 px-3">
                              <StatusBadge status={move.type} className="text-[10px]" />
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              {move.type === 'INBOUND' ? '+' : move.type === 'OUTBOUND' ? '-' : ''}
                              {move.quantity}
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">{move.previousStock}</td>
                            <td className="py-2 px-3 text-right font-semibold">{move.newStock}</td>
                            <td className="py-2 px-3 text-muted-foreground truncate max-w-[150px]" title={move.reason}>
                              {move.reason || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Delete confirmation dialog */}
          <ConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Deactivate Product?"
            description={`Are you sure you want to deactivate ${product.name}? This product will be marked as inactive and cannot be selected in future purchase or sales orders.`}
            isDestructive={true}
            confirmText="Deactivate"
          />
        </>
      )}
    </div>
  );
};

// X Icon definition for form exit button
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export default ProductDetailPage;
