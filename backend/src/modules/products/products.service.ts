import { prisma } from '../../config/database';
import { Prisma, MovementType } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';
import { CreateProductInput, UpdateProductInput, ProductQuery } from './products.schema';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { generateSKU } from '../../utils/generateSKU';

export class ProductsService {
  async getAllProducts(query: ProductQuery) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Prisma.ProductWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    if (query.lowStock === 'true') {
      // Prisma 5.x column comparison
      where.currentStock = { lte: prisma.product.fields.reorderThreshold };
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const total = await prisma.product.count({ where });
    const data = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: true,
        suppliers: {
          include: {
            supplier: true,
          },
        },
      },
    });

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        suppliers: {
          include: {
            supplier: true,
          },
        },
      },
    });
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    return product;
  }

  async createProduct(input: CreateProductInput, userId: string) {
    const { supplierIds, categoryId, ...productData } = input;

    // Verify category exists
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new ApiError(404, 'Category not found');
      }
    }

    // Auto-generate SKU if not provided
    let sku = productData.sku;
    if (!sku) {
      const categoryName = categoryId
        ? (await prisma.category.findUnique({ where: { id: categoryId } }))?.name || 'GEN'
        : 'GEN';
      sku = generateSKU(categoryName, productData.name);
    }

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      throw new ApiError(409, `Product with SKU ${sku} already exists`);
    }

    // Connect suppliers if provided
    const suppliersCreate = supplierIds?.map((sid) => ({
      supplier: { connect: { id: sid } },
    }));

    // Start a transaction to ensure atomic creation of product + stock movement
    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          ...productData,
          sku: sku!,
          categoryId,
          suppliers: suppliersCreate ? { create: suppliersCreate } : undefined,
        },
        include: {
          category: true,
          suppliers: {
            include: {
              supplier: true,
            },
          },
        },
      });

      // Log initial stock movement if currentStock > 0
      if (createdProduct.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: createdProduct.id,
            type: MovementType.INBOUND,
            quantity: createdProduct.currentStock,
            previousStock: 0,
            newStock: createdProduct.currentStock,
            reason: 'Initial stock intake',
            createdById: userId,
          },
        });
      }

      return createdProduct;
    });

    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const { supplierIds, categoryId, ...productData } = input;

    // Verify product exists
    const existingProduct = await this.getProductById(id);

    // Verify category exists
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new ApiError(404, 'Category not found');
      }
    }

    if (productData.sku && productData.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: productData.sku } });
      if (existingSku) {
        throw new ApiError(409, `Product with SKU ${productData.sku} already exists`);
      }
    }

    return prisma.$transaction(async (tx) => {
      // If supplierIds are provided, overwrite old links
      if (supplierIds !== undefined) {
        // Delete existing links
        await tx.productSupplier.deleteMany({
          where: { productId: id },
        });

        // Create new links
        if (supplierIds.length > 0) {
          await tx.productSupplier.createMany({
            data: supplierIds.map((sid) => ({
              productId: id,
              supplierId: sid,
            })),
          });
        }
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...productData,
          categoryId,
        },
        include: {
          category: true,
          suppliers: {
            include: {
              supplier: true,
            },
          },
        },
      });

      return updatedProduct;
    });
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);

    // Soft delete: update isActive to false
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async uploadImage(id: string, imageUrl: string) {
    await this.getProductById(id);

    return prisma.product.update({
      where: { id },
      data: { imageUrl },
    });
  }

  async exportProductsCSV() {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    const headers = [
      'ID',
      'Name',
      'SKU',
      'Category',
      'UnitPrice',
      'CostPrice',
      'UnitOfMeasure',
      'CurrentStock',
      'ReorderThreshold',
      'IsActive',
      'CreatedAt',
    ];

    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category ? `"${p.category.name.replace(/"/g, '""')}"` : '',
      p.unitPrice.toString(),
      p.costPrice.toString(),
      p.unitOfMeasure,
      p.currentStock.toString(),
      p.reorderThreshold.toString(),
      p.isActive ? 'true' : 'false',
      p.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }
}

export const productsService = new ProductsService();
export default productsService;
