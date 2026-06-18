import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2, Calendar, ShoppingBag } from 'lucide-react';
import ordersApi from '../../api/orders.api';
import productsApi from '../../api/products.api';
import suppliersApi from '../../api/suppliers.api';
import { OrderType } from '../../types/order.types';
import { Product } from '../../types/product.types';
import { Supplier } from '../../types/supplier.types';
import { formatCurrency } from '../../utils/formatters';

const lineItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().min(1, 'Qty must be >= 1'),
  unitPrice: z.coerce.number().min(0, 'Price must be >= 0'),
});

const orderFormSchema = z.object({
  type: z.enum(['PURCHASE', 'SALES']),
  supplierId: z.string().optional(),
  customerName: z.string().optional(),
  customerContact: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Order must contain at least 1 item'),
}).superRefine((data, ctx) => {
  if (data.type === 'PURCHASE' && !data.supplierId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Supplier is required for Purchase Orders',
      path: ['supplierId'],
    });
  }
  if (data.type === 'SALES' && !data.customerName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Customer Name is required for Sales Orders',
      path: ['customerName'],
    });
  }
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  type: OrderType;
  preselectedProduct?: { productId: string; unitCost: number } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  type,
  preselectedProduct,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();

  // Fetch active Products catalog
  const { data: productsRes } = useQuery({
    queryKey: ['products-order-catalog'],
    queryFn: () => productsApi.getAll({ limit: 100, isActive: 'true' }),
  });
  const products: Product[] = productsRes?.data || [];

  // Fetch active Suppliers (for PURCHASE orders)
  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers-order-list'],
    queryFn: () => suppliersApi.getAll({ limit: 100, isActive: true }),
    enabled: type === 'PURCHASE',
  });
  const suppliers: Supplier[] = suppliersRes?.data || [];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      type,
      supplierId: '',
      customerName: '',
      customerContact: '',
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // default 7 days from now
      notes: '',
      lineItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  // Pre-populate product if passed via dashboard reorder action
  useEffect(() => {
    if (preselectedProduct && products.length > 0) {
      setValue('lineItems', [
        {
          productId: preselectedProduct.productId,
          quantity: 10, // Default a reasonable reorder quantity
          unitPrice: preselectedProduct.unitCost,
        },
      ]);
    }
  }, [preselectedProduct, products, setValue]);

  const watchedItems = watch('lineItems') || [];
  const selectedSupplierId = watch('supplierId');

  // Filter products by selected supplier in PURCHASE orders if desired,
  // or show all products supplying this suppliers
  const getAvailableProducts = () => {
    if (type === 'PURCHASE' && selectedSupplierId) {
      // Return products that list this supplier, or fallback to all
      const filtered = products.filter((p) =>
        p.suppliers.some((s) => s.supplierId === selectedSupplierId)
      );
      return filtered.length > 0 ? filtered : products;
    }
    return products;
  };

  const availableProducts = getAvailableProducts();

  // Autofill pricing on product selection
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (selectedProduct) {
      const price = type === 'PURCHASE' ? selectedProduct.costPrice : selectedProduct.unitPrice;
      setValue(`lineItems.${index}.unitPrice`, price, { shouldValidate: true });
    }
  };

  // Calculate dynamic subtotals & overall sum
  const calculatedLineItems = watchedItems.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return {
      subtotal: quantity * unitPrice,
    };
  });

  const totalAmount = calculatedLineItems.reduce((sum, item) => sum + item.subtotal, 0);

  const orderMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Order drafted successfully');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to draft order');
    },
  });

  const onSubmit = (values: OrderFormValues) => {
    orderMutation.mutate({
      type: values.type,
      supplierId: values.supplierId || undefined,
      customerName: values.customerName || undefined,
      customerContact: values.customerContact || undefined,
      expectedDate: values.expectedDate ? new Date(values.expectedDate).toISOString() : undefined,
      notes: values.notes || undefined,
      lineItems: values.lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-foreground text-left max-w-4xl mx-auto">
      {/* Upper Meta form section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 border border-border rounded-xl p-4">
        
        {/* PURCHASE: Supplier, SALES: Customer Info */}
        {type === 'PURCHASE' ? (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Select Supplier *
            </label>
            <select
              {...register('supplierId')}
              className={`w-full px-3 py-2 bg-background border ${
                errors.supplierId ? 'border-rose-500' : 'border-input focus:ring-primary focus:border-primary'
              } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 cursor-pointer transition-colors`}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supplierId && <p className="mt-1 text-xs text-rose-500">{errors.supplierId.message}</p>}
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Customer Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corporation"
                {...register('customerName')}
                className={`w-full px-3 py-2 bg-background border ${
                  errors.customerName ? 'border-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.customerName && <p className="mt-1 text-xs text-rose-500">{errors.customerName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Customer Contact
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                {...register('customerContact')}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </>
        )}

        {/* Expected Delivery Date */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            Expected Date
          </label>
          <div className="relative">
            <input
              type="date"
              {...register('expectedDate')}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Line items Array Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>Order Line Items</span>
          </h4>
          <button
            type="button"
            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
            className="inline-flex items-center gap-1 border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-2.5 py-1.5 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {errors.lineItems && (
          <p className="text-xs text-rose-500 font-semibold">{errors.lineItems.message || errors.lineItems.root?.message}</p>
        )}

        <div className="space-y-3.5">
          {fields.map((field, index) => {
            const currentSubtotal = calculatedLineItems[index]?.subtotal || 0;
            return (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-card border border-border/80 rounded-xl p-4 shadow-sm relative animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Select Product */}
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                    Select Product
                  </label>
                  <select
                    {...register(`lineItems.${index}.productId` as const)}
                    onChange={(e) => {
                      setValue(`lineItems.${index}.productId`, e.target.value);
                      handleProductSelect(index, e.target.value);
                    }}
                    className={`w-full px-3 py-2 bg-background border ${
                      errors.lineItems?.[index]?.productId ? 'border-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                    } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 cursor-pointer transition-colors`}
                  >
                    <option value="">Select Catalog Item</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="w-full sm:w-28">
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register(`lineItems.${index}.quantity` as const)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>

                {/* Unit Price (INR) */}
                <div className="w-full sm:w-36">
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`lineItems.${index}.unitPrice` as const)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>

                {/* Subtotal column */}
                <div className="w-full sm:w-32 flex flex-col text-right">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5 block sm:hidden">
                    Subtotal
                  </span>
                  <span className="text-sm font-bold block pr-2 mt-1 sm:mt-4 text-foreground">
                    {formatCurrency(currentSubtotal)}
                  </span>
                </div>

                {/* Remove Row Button */}
                <button
                  type="button"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  className="sm:mt-4 p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
                  title="Remove item row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Notes */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
          Order Notes
        </label>
        <textarea
          rows={3}
          placeholder="Provide order terms, tracking parameters, logistics references, or extra specifications..."
          {...register('notes')}
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/50 transition-colors"
        />
      </div>

      {/* Footer totals & actions panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-6">
        <div className="text-left">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Value</span>
          <p className="text-2xl font-extrabold text-primary">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Drafting Order...
              </>
            ) : (
              'Save as Draft'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrderForm;
