import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ShoppingBag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import suppliersApi from '../../api/suppliers.api';
import ordersApi from '../../api/orders.api';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '../../types/supplier.types';
import { Order } from '../../types/order.types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usePermissions } from '../../hooks/usePermissions';

// Zod schema for supplier validation
const supplierFormSchema = z.object({
  name: z.string().min(1, 'Company Name is required').max(100, 'Company Name must be under 100 characters'),
  contactPerson: z.string().min(1, 'Contact Person is required').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.enum(['Net 15', 'Net 30', 'Net 60', 'COD']).default('Net 30'),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { canManageSuppliers } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal / Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // 1. Fetch suppliers paginated list
  const queryParams = {
    page: page + 1,
    limit: pageSize,
    search: search.trim() || undefined,
  };

  const {
    data: suppliersData,
    isLoading: isSuppliersLoading,
    isError: isSuppliersError,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: ['suppliers', queryParams],
    queryFn: () => suppliersApi.getAll(queryParams),
  });

  // 2. Fetch purchase orders for selected supplier (detail view)
  const { data: supplierOrdersRes } = useQuery({
    queryKey: ['supplier-orders', selectedSupplier?.id],
    queryFn: () => ordersApi.getAll({ supplierId: selectedSupplier!.id, limit: 20 }),
    enabled: isDetailOpen && !!selectedSupplier,
  });
  const supplierOrders: Order[] = supplierOrdersRes?.data || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: 'Net 30',
      notes: '',
      isActive: true,
    },
    mode: 'onBlur',
  });

  const handleAddClick = () => {
    setEditingSupplier(null);
    reset({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: 'Net 30',
      notes: '',
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (s: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSupplier(s);
    reset({
      name: s.name,
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      paymentTerms: (s.paymentTerms as any) || 'Net 30',
      notes: s.notes || '',
      isActive: s.isActive,
    });
    setIsFormOpen(true);
  };

  const handleDetailClick = (s: Supplier) => {
    setSelectedSupplier(s);
    setIsDetailOpen(true);
  };

  const handleDeleteClick = (s: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setSupplierToDelete(s);
    setIsDeleteDialogOpen(true);
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (values: SupplierFormValues) => {
      const payload = {
        name: values.name,
        contactPerson: values.contactPerson || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        paymentTerms: values.paymentTerms,
        notes: values.notes || undefined,
        isActive: values.isActive,
      };

      if (editingSupplier) {
        return suppliersApi.update(editingSupplier.id, payload as UpdateSupplierInput);
      } else {
        return suppliersApi.create(payload as CreateSupplierInput);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully');
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save supplier details');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deactivated successfully');
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate supplier');
    },
  });

  const onSubmit = (values: SupplierFormValues) => {
    saveMutation.mutate(values);
  };

  const handleConfirmDelete = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete.id);
    }
  };

  // Define table columns
  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'name',
      header: 'Supplier Name',
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: 'contactPerson',
      header: 'Contact Person',
      cell: ({ row }) => <span>{row.original.contactPerson || '-'}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email || '-'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone || '-'}</span>,
    },
    {
      id: 'productsCount',
      header: 'Products Supplied',
      cell: ({ row }) => <span>{row.original._count?.products || 0} product(s)</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleDetailClick(s)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManageSuppliers && (
              <>
                <button
                  onClick={(e) => handleEditClick(s, e)}
                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit supplier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(s, e)}
                  disabled={!s.isActive}
                  className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Deactivate supplier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      },
      size: 100,
    },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 text-foreground text-left relative w-full min-h-full">
      {/* 1. Add/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 rounded-md p-1 hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold mb-1">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
            <p className="text-xs text-muted-foreground mb-6">Enter details for the inventory supplying partner</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Steel Ltd"
                  {...register('name')}
                  className={`w-full px-3 py-2 bg-background border ${
                    errors.name ? 'border-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                  } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  {...register('contactPerson')}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="text"
                    placeholder="sales@company.com"
                    {...register('email')}
                    className={`w-full px-3 py-2 bg-background border ${
                      errors.email ? 'border-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                    } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765-43210"
                    {...register('phone')}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Physical Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Supplier factory or head office location details..."
                  {...register('address')}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Payment Terms
                </label>
                <select
                  {...register('paymentTerms')}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-colors"
                >
                  <option value="Net 15">Net 15 (15 days)</option>
                  <option value="Net 30">Net 30 (30 days)</option>
                  <option value="Net 60">Net 60 (60 days)</option>
                  <option value="COD">COD (Cash on Delivery)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Special Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Supplier constraints, delivery options, discount terms..."
                  {...register('notes')}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-4 text-sm">
                <div>
                  <span className="font-semibold">Is Active Partner</span>
                  <p className="text-[10px] text-muted-foreground">Deactive partners cannot be selected in future PO drafts</p>
                </div>
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="rounded border-input text-primary focus:ring-primary w-5 h-5 cursor-pointer bg-background"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="inline-flex justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Detail Slide-over Panel / Drawer */}
      {isDetailOpen && selectedSupplier && (
        <>
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40"
            onClick={() => {
              setIsDetailOpen(false);
              setSelectedSupplier(null);
            }}
          />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-card border-l border-border shadow-2xl p-6 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">{selectedSupplier.name}</h3>
              </div>
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedSupplier(null);
                }}
                className="p-1 rounded hover:bg-muted border border-input text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile specifications */}
            <div className="space-y-4 text-xs">
              <h4 className="font-semibold text-muted-foreground uppercase border-b border-border/60 pb-1">Supplier Profile</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Contact Person</span>
                    <span className="font-semibold text-foreground">{selectedSupplier.contactPerson || '-'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Payment Terms</span>
                    <span className="font-semibold text-foreground">{selectedSupplier.paymentTerms || '-'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Email</span>
                    <span className="font-semibold text-foreground truncate block max-w-[150px]">{selectedSupplier.email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Phone</span>
                    <span className="font-semibold text-foreground">{selectedSupplier.phone || '-'}</span>
                  </div>
                </div>
              </div>

              {selectedSupplier.address && (
                <div className="flex items-start gap-2 border-t border-border pt-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Address</span>
                    <p className="text-foreground leading-relaxed mt-0.5">{selectedSupplier.address}</p>
                  </div>
                </div>
              )}

              {selectedSupplier.notes && (
                <div className="border-t border-border pt-3">
                  <span className="text-muted-foreground block text-[10px]">Remarks & Notes</span>
                  <p className="text-muted-foreground bg-muted/40 rounded p-2 italic leading-relaxed mt-1">{selectedSupplier.notes}</p>
                </div>
              )}
            </div>

            {/* Linked Orders logs */}
            <div className="mt-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2 mb-3 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Procurement Order Logs ({supplierOrders.length})</span>
              </h4>

              {supplierOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No purchase orders history logged with this supplier.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {supplierOrders.map((o) => (
                    <div key={o.id} className="border border-border/80 rounded p-2.5 flex items-center justify-between text-xs hover:bg-muted/30">
                      <div>
                        <span className="font-mono font-semibold text-foreground">{o.orderNumber}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Created: {formatDate(o.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground block">{formatCurrency(o.totalAmount)}</span>
                        <div className="mt-0.5"><StatusBadge status={o.status} className="text-[9px]" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Page Layout */}
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Procurement source directory, logistics partners, payment terms records</p>
        </div>
        
        {canManageSuppliers && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/95 rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Supplier
          </button>
        )}
      </div>

      {/* Searching Bar */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search suppliers by name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/60 transition-colors"
          />
        </div>
      </div>

      {/* Suppliers Table list */}
      {isSuppliersError ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Failed to load suppliers</h3>
          <p className="text-sm text-muted-foreground mb-6">There was an issue fetching the suppliers directory from the server.</p>
          <button
            onClick={() => refetchSuppliers()}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/95 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={suppliersData?.data || []}
          isLoading={isSuppliersLoading}
          onRowClick={(s) => handleDetailClick(s)}
          serverPagination={{
            pageIndex: page,
            pageSize: pageSize,
            pageCount: suppliersData?.meta?.totalPages || 0,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      )}

      {/* Deletion confirmation dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSupplierToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Deactivate Supplier Partner?"
        description={`Are you sure you want to deactivate ${supplierToDelete?.name}? Deactivated suppliers cannot be linked to new procurements.`}
        isDestructive={true}
        confirmText="Deactivate"
      />
    </div>
  );
};

export default SuppliersPage;
