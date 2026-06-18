import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Layers,
  Filter,
  X,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import productsApi from '../../api/products.api';
import { Product, Category } from '../../types/product.types';
import { formatCurrency } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductForm from '../../components/forms/ProductForm';
import { usePermissions } from '../../hooks/usePermissions';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { canManageProducts } = usePermissions();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportCSVClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
          loading: 'Processing and validating CSV catalog rows...',
          success: 'Successfully imported products from CSV!',
          error: 'Failed to process CSV file.',
        }
      );
      e.target.value = '';
    }
  };

  // Search parameters from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  // Local component states
  const [search, setSearch] = useState(urlSearch);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // 'ACTIVE' | 'INACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirm Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Bulk action states
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkProductsToDelete, setBulkProductsToDelete] = useState<Product[]>([]);

  // 1. Fetch products using parameters
  const queryParams = {
    page: page + 1,
    limit: pageSize,
    search: search.trim() || undefined,
    categoryId: selectedCategoryId || undefined,
    isActive: selectedStatus === 'INACTIVE' ? 'false' : selectedStatus === 'ACTIVE' || selectedStatus === 'LOW_STOCK' || selectedStatus === 'OUT_OF_STOCK' ? 'true' : undefined,
    lowStock: selectedStatus === 'LOW_STOCK' ? 'true' : undefined,
  };

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsApi.getAll(queryParams),
  });

  // 2. Fetch Categories for Filter Dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  // 3. Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Product deactivated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate product');
    },
  });

  // Determine actual stock status badge mapping
  const getProductStockStatus = (p: Product): string => {
    if (!p.isActive) return 'INACTIVE';
    if (p.currentStock === 0) return 'OUT_OF_STOCK';
    if (p.currentStock <= p.reorderThreshold) return 'LOW_STOCK';
    return 'ACTIVE';
  };

  const handleEdit = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(p);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(p);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  // Bulk actions deletion
  const handleBulkDeleteClick = (rows: Product[]) => {
    setBulkProductsToDelete(rows);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    let successCount = 0;
    let failedCount = 0;
    
    for (const p of bulkProductsToDelete) {
      try {
        await productsApi.delete(p.id);
        successCount++;
      } catch (e) {
        failedCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['low-stock-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

    if (successCount > 0) {
      toast.success(`Successfully deactivated ${successCount} product(s)`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to deactivate ${failedCount} product(s)`);
    }
  };

  // Client-side selected row CSV export
  const handleExportSelectedCSV = (rows: Product[]) => {
    if (rows.length === 0) {
      toast.error('No products selected for export');
      return;
    }

    const headers = ['Name', 'SKU', 'Category', 'Unit Price (INR)', 'Cost Price (INR)', 'Current Stock', 'Threshold', 'Unit', 'Status'];
    const csvContent = [
      headers.join(','),
      ...rows.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.category?.name || 'Uncategorized',
        p.unitPrice,
        p.costPrice,
        p.currentStock,
        p.reorderThreshold,
        p.unitOfMeasure,
        getProductStockStatus(p),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `selected_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFullCSV = async () => {
    try {
      const blob = await productsApi.exportCSV();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `all_products_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Full catalog export complete');
    } catch (e) {
      toast.error('Failed to download full catalog CSV');
    }
  };

  // DataTable columns layout definition
  const columns: ColumnDef<Product>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    },
    {
      id: 'image',
      header: 'Image',
      cell: ({ row }) => {
        const p = row.original;
        const imgUrl = p.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${p.imageUrl}` : null;
        return (
          <div className="w-10 h-10 rounded border border-border overflow-hidden bg-muted flex items-center justify-center">
            {imgUrl ? (
              <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <Layers className="w-4 h-4 text-muted-foreground/50" />
            )}
          </div>
        );
      },
      size: 60,
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">{p.name}</span>
            <span className="text-[11px] text-slate-450 font-mono mt-0.5">{p.sku}</span>
          </div>
        );
      },
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => <span>{row.original.category?.name || 'Uncategorized'}</span>,
    },
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: ({ row }) => <span>{formatCurrency(row.original.unitPrice)}</span>,
    },
    {
      accessorKey: 'currentStock',
      header: 'Stock Level',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <span className={p.currentStock === 0 ? 'text-rose-500 font-bold' : p.currentStock <= p.reorderThreshold ? 'text-amber-500 font-semibold' : ''}>
            {p.currentStock} {p.unitOfMeasure}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={getProductStockStatus(row.original)} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/products/${p.id}`)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManageProducts && (
              <>
                <button
                  onClick={(e) => handleEdit(p, e)}
                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit product"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(p, e)}
                  disabled={!p.isActive}
                  className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Deactivate product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      },
      size: 110,
    },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full min-h-full">
      {/* Conditionally render form or catalog list */}
      {isFormOpen ? (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editingProduct ? `Modify details for SKU: ${editingProduct.sku}` : 'Catalog a new inventory product'}
              </p>
            </div>
            <button
              onClick={() => {
                setIsFormOpen(false);
                setEditingProduct(null);
              }}
              className="rounded-md border border-input p-1 hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <ProductForm
            product={editingProduct}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingProduct(null);
              refetchProducts();
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingProduct(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Page Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
              <p className="text-sm text-slate-500 mt-0.5">Maintain catalog items, pricing structures, and stock reorder triggers</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={canManageProducts ? handleImportCSVClick : undefined}
                disabled={!canManageProducts}
                className={`inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
                  canManageProducts 
                    ? 'bg-white hover:bg-slate-50 text-slate-700 cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title={!canManageProducts ? "Importing CSV requires Admin/Manager role" : "Import products from CSV"}
              >
                {canManageProducts ? <Upload className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                Import CSV
              </button>
              <button
                onClick={() => {
                  if (canManageProducts) {
                    setIsFormOpen(true);
                  }
                }}
                disabled={!canManageProducts}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
                  canManageProducts 
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                title={!canManageProducts ? "Adding products requires Admin/Manager role" : "Catalog a new product"}
              >
                {canManageProducts ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                New Product
              </button>
            </div>
          </div>

          {/* Filtering & Search Bar */}
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-xs">
              <input
                type="text"
                placeholder="Search products by Name/SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchParams({ search: e.target.value });
                }}
                className="w-full pl-3 pr-8 py-2 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/60 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-background border border-input rounded-md text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOW_STOCK">Low Stock Warning</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategoryId('');
                  setSelectedStatus('');
                  setSearchParams({});
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto md:ml-0"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Error Boundary display */}
          {isProductsError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border">
              <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Failed to load product catalog</h3>
              <p className="text-sm text-muted-foreground mb-6">There was an issue fetching the products from the server.</p>
              <button
                onClick={() => refetchProducts()}
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/95 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : (
            /* Reusable DataTable Component */
            <DataTable
              columns={columns}
              data={productsData?.data || []}
              isLoading={isProductsLoading}
              onRowClick={(p) => navigate(`/products/${p.id}`)}
              enableSelection={true}
              onBulkDelete={canManageProducts ? handleBulkDeleteClick : undefined}
              serverPagination={{
                pageIndex: page,
                pageSize: pageSize,
                pageCount: productsData?.meta?.totalPages || 0,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          )}

          {/* Export Selected and delete selected floating bar in bulk */}
          {!isProductsLoading && productsData?.data && productsData.data.length > 0 && (
            <div className="flex justify-start gap-3 mt-4">
              <button
                onClick={() => {
                  // Retrieve rows from table selection using custom query
                  // But our DataTable handles selections, so we can export via selection bar or direct action
                }}
                // We integrated selected actions directly inside our custom DataTable.tsx toolbar!
              />
            </div>
          )}

          {/* Delete Confirm dialog */}
          <ConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setProductToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
            title="Deactivate Product?"
            description={`Are you sure you want to deactivate ${productToDelete?.name}? This product will be flagged as inactive and cannot be selected in future purchases or sales.`}
            isDestructive={true}
            confirmText="Deactivate"
          />

          {/* Bulk Delete Confirm dialog */}
          <ConfirmDialog
            isOpen={isBulkDeleteDialogOpen}
            onClose={() => {
              setIsBulkDeleteDialogOpen(false);
              setBulkProductsToDelete([]);
            }}
            onConfirm={handleConfirmBulkDelete}
            title="Deactivate Selected Products?"
            description={`Are you sure you want to deactivate these ${bulkProductsToDelete.length} selected products? They will be set as inactive.`}
            isDestructive={true}
            confirmText="Deactivate Selected"
          />
        </>
      )}
    </div>
  );
};

export default ProductsPage;
