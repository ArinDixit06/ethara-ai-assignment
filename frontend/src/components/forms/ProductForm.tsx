import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, X, Upload, Loader2, Sparkles } from 'lucide-react';
import productsApi from '../../api/products.api';
import suppliersApi from '../../api/suppliers.api';
import { Category, Product, CreateProductInput } from '../../types/product.types';
import { Supplier } from '../../types/supplier.types';

const productFormSchema = z.object({
  name: z.string().min(1, 'Product Name is required').max(100, 'Name must be under 100 characters'),
  sku: z.string().refine((val) => !val || /^[A-Z0-9-]+$/.test(val), {
    message: 'SKU must be uppercase alphanumeric and can contain dashes',
  }).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  unitPrice: z.coerce.number().min(0, 'Selling Price must be 0 or more'),
  costPrice: z.coerce.number().min(0, 'Cost Price must be 0 or more'),
  reorderThreshold: z.coerce.number().min(0, 'Threshold must be 0 or more'),
  unitOfMeasure: z.string().min(1, 'Unit of Measure is required'),
  currentStock: z.coerce.number().min(0, 'Initial Stock must be 0 or more').optional(),
  supplierIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product | null; // null if creating a new one
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const isEditMode = !!product;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}` : null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch Categories
  const { data: categories = [], refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  // Fetch Suppliers
  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersApi.getAll({ limit: 100 }),
  });
  const suppliers: Supplier[] = suppliersRes?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      categoryId: product?.categoryId || '',
      description: product?.description || '',
      unitPrice: product?.unitPrice || 0,
      costPrice: product?.costPrice || 0,
      reorderThreshold: product?.reorderThreshold || 10,
      unitOfMeasure: product?.unitOfMeasure || 'pcs',
      currentStock: product?.currentStock || 0,
      supplierIds: product?.suppliers?.map((s) => s.supplierId) || [],
      isActive: product?.isActive !== undefined ? product.isActive : true,
    },
    mode: 'onBlur',
  });

  const selectedSupplierIds = watch('supplierIds') || [];

  // Generate a random SKU automatically
  const handleAutoGenerateSKU = () => {
    const namePart = watch('name').trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    const catId = watch('categoryId');
    const categoryName = categories.find((c) => c.id === catId)?.name || 'GEN';
    const catPart = categoryName.slice(0, 3).toUpperCase();
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const generated = `${catPart}-${namePart}-${randPart}`;
    setValue('sku', generated, { shouldValidate: true });
  };

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Add category mutation
  const createCategoryMutation = useMutation({
    mutationFn: productsApi.createCategory,
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      refetchCategories();
      setValue('categoryId', newCat.id, { shouldValidate: true });
      setIsCreatingCategory(false);
      setNewCategoryName('');
      toast.success('Category created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create category');
    },
  });

  const handleCreateCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  // Supplier multi-select helper
  const handleToggleSupplier = (supplierId: string) => {
    const current = [...selectedSupplierIds];
    const index = current.indexOf(supplierId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(supplierId);
    }
    setValue('supplierIds', current, { shouldValidate: true });
  };

  const handleFormSubmit = async (values: ProductFormValues) => {
    try {
      let savedProduct: Product;
      
      if (isEditMode && product) {
        savedProduct = await productsApi.update(product.id, {
          name: values.name,
          sku: values.sku,
          categoryId: values.categoryId,
          description: values.description,
          unitPrice: values.unitPrice,
          costPrice: values.costPrice,
          reorderThreshold: values.reorderThreshold,
          unitOfMeasure: values.unitOfMeasure,
          supplierIds: values.supplierIds,
          isActive: values.isActive,
        });
        toast.success('Product updated successfully');
      } else {
        savedProduct = await productsApi.create({
          name: values.name,
          sku: values.sku,
          categoryId: values.categoryId,
          description: values.description,
          unitPrice: values.unitPrice,
          costPrice: values.costPrice,
          reorderThreshold: values.reorderThreshold,
          unitOfMeasure: values.unitOfMeasure,
          currentStock: values.currentStock,
          supplierIds: values.supplierIds,
          isActive: values.isActive,
        } as CreateProductInput);
        toast.success('Product created successfully');
      }

      // Handle image upload if a file was selected
      if (imageFile) {
        await productsApi.uploadImage(savedProduct.id, imageFile);
      }

      // Invalidate queries in cache
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      onSuccess(savedProduct);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product details');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 text-foreground text-left max-w-4xl mx-auto">
      {/* 2-Column form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Product Identity & Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold border-b border-border pb-1.5 text-muted-foreground uppercase tracking-wider">
            Product details
          </h3>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Brake Caliper Assembly"
              {...register('name')}
              className={`w-full px-3 py-2 bg-background border ${
                errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-input focus:ring-primary focus:border-primary'
              } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          {/* SKU Field with Auto Generation */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              SKU (Stock Keeping Unit)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. AUT-BRA-1004"
                {...register('sku')}
                className={`flex-1 px-3 py-2 bg-background border ${
                  errors.sku ? 'border-rose-500 focus:ring-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors uppercase`}
              />
              <button
                type="button"
                onClick={handleAutoGenerateSKU}
                className="inline-flex items-center justify-center gap-1.5 border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-2 rounded-md transition-colors"
                title="Auto-generate SKU based on category and name"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>
            </div>
            {errors.sku && <p className="mt-1 text-xs text-rose-500">{errors.sku.message}</p>}
            <p className="mt-1 text-[10px] text-muted-foreground">Keep empty to auto-generate SKU on submission</p>
          </div>

          {/* Category Dropdown with Create New */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Category *
            </label>
            {!isCreatingCategory ? (
              <div className="flex gap-2">
                <select
                  {...register('categoryId')}
                  className={`flex-1 px-3 py-2 bg-background border ${
                    errors.categoryId ? 'border-rose-500 focus:ring-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                  } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors cursor-pointer`}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="inline-flex items-center justify-center border border-input bg-card text-foreground hover:bg-muted p-2 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending}
                  className="inline-flex items-center justify-center bg-primary text-white text-xs font-semibold px-3 py-2 rounded-md transition-colors hover:bg-primary/95"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="inline-flex items-center justify-center border border-input bg-card text-foreground hover:bg-muted p-2 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {errors.categoryId && <p className="mt-1 text-xs text-rose-500">{errors.categoryId.message}</p>}
          </div>

          {/* Description field */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide a detailed product description..."
              {...register('description')}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/50 transition-colors"
            />
            {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>}
          </div>
        </div>

        {/* Right Column: Pricing, Inventory levels, Suppliers, Images */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold border-b border-border pb-1.5 text-muted-foreground uppercase tracking-wider">
            Pricing & stock control
          </h3>

          {/* Cost Price vs Selling Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Cost Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('costPrice')}
                className={`w-full px-3 py-2 bg-background border ${
                  errors.costPrice ? 'border-rose-500 focus:ring-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.costPrice && <p className="mt-1 text-xs text-rose-500">{errors.costPrice.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('unitPrice')}
                className={`w-full px-3 py-2 bg-background border ${
                  errors.unitPrice ? 'border-rose-500 focus:ring-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.unitPrice && <p className="mt-1 text-xs text-rose-500">{errors.unitPrice.message}</p>}
            </div>
          </div>

          {/* Unit of Measure & Reorder Point */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Unit of Measure *
              </label>
              <select
                {...register('unitOfMeasure')}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="litre">litre (Litres)</option>
                <option value="box">box (Boxes)</option>
                <option value="set">set (Sets)</option>
                <option value="meter">meter (Meters)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Reorder Threshold *
              </label>
              <input
                type="number"
                {...register('reorderThreshold')}
                className={`w-full px-3 py-2 bg-background border ${
                  errors.reorderThreshold ? 'border-rose-500 focus:ring-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.reorderThreshold && <p className="mt-1 text-xs text-rose-500">{errors.reorderThreshold.message}</p>}
            </div>
          </div>

          {/* Initial Stock (Only on create) */}
          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                {...register('currentStock')}
                className={`w-full px-3 py-2 bg-background border ${
                  errors.currentStock ? 'border-rose-500 focus:ring-rose-500' : 'border-input focus:ring-primary focus:border-primary'
                } rounded-md text-sm text-foreground focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.currentStock && <p className="mt-1 text-xs text-rose-500">{errors.currentStock.message}</p>}
            </div>
          )}

          {/* Image Upload with Preview */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Product Image
            </label>
            <div className="flex gap-4 items-center">
              <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted border border-border overflow-hidden flex items-center justify-center text-muted-foreground relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 opacity-40" />
                )}
              </div>
              <label className="cursor-pointer border border-input hover:bg-muted font-semibold text-xs px-3.5 py-2.5 rounded-md text-foreground transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="text-xs text-rose-600 dark:text-rose-450 hover:underline font-semibold"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-border mt-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Is Active</span>
              <span className="text-[10px] text-muted-foreground">Deactivated items cannot be added to new orders</span>
            </div>
            <input
              type="checkbox"
              {...register('isActive')}
              className="rounded border-input text-primary focus:ring-primary w-5 h-5 cursor-pointer bg-background"
            />
          </div>
        </div>
      </div>

      {/* Associated Suppliers Checkbox list */}
      <div className="border-t border-border pt-4 mt-6">
        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
          Suppliers supplying this Product
        </label>
        {suppliers.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No suppliers found. Add a supplier first.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {suppliers.map((s) => {
              const isChecked = selectedSupplierIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => handleToggleSupplier(s.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 border rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span className="truncate">{s.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Actions Footer */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
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
              Saving Product...
            </>
          ) : (
            'Save Product'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
