import { prisma } from '../../config/database';
import { Prisma, MovementType } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';
import { StockAdjustmentInput } from './inventory.schema';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';

export class InventoryService {
  async getInventory(query: any) {
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

    const total = await prisma.product.count({ where });
    const data = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { currentStock: 'asc' }, // default sort by stock level (low to high is helpful)
      include: {
        category: true,
      },
    });

    return buildPaginatedResponse(data, total, page, limit);
  }

  async adjustStock(input: StockAdjustmentInput, userId: string) {
    const { productId, type, quantity, reason, notes } = input;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      const previousStock = product.currentStock;
      let newStock = previousStock;

      if (type === 'ADD') {
        newStock = previousStock + quantity;
      } else if (type === 'REMOVE') {
        newStock = previousStock - quantity;
        if (newStock < 0) {
          throw new ApiError(400, `Insufficient stock for product: ${product.name}. Current: ${previousStock}, Attempted to remove: ${quantity}`);
        }
      } else if (type === 'SET') {
        newStock = quantity;
      }

      // Update product current stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Record stock movement
      const quantityChanged = Math.abs(newStock - previousStock);
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type: MovementType.ADJUSTMENT,
          quantity: quantityChanged,
          previousStock,
          newStock,
          reason,
          notes,
          createdById: userId,
        },
      });

      return {
        product: updatedProduct,
        movement,
      };
    });
  }

  async getMovements(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Prisma.StockMovementWhereInput = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.type) {
      where.type = query.type as MovementType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const total = await prisma.stockMovement.count({ where });
    const data = await prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        product: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getLowStock() {
    // Use raw SQL for column-to-column comparison (currentStock <= reorderThreshold)
    // Prisma's standard API only supports static value comparisons, not field references
    const lowStockProducts = await prisma.$queryRaw<any[]>`
      SELECT
        p.*,
        row_to_json(c.*) AS category
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE p."currentStock" <= p."reorderThreshold"
        AND p."isActive" = true
      ORDER BY p."currentStock" ASC
    `;

    // Parse category from raw JSON if needed
    return lowStockProducts.map((p: any) => ({
      ...p,
      category: typeof p.category === 'string' ? JSON.parse(p.category) : p.category,
    }));
  }

  async getValuation() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        currentStock: true,
        costPrice: true,
      },
    });

    const totalValuation = products.reduce((acc, p) => {
      const cost = Number(p.costPrice) || 0;
      return acc + p.currentStock * cost;
    }, 0);

    return { totalInventoryValue: totalValuation };
  }

  async exportMovementsCSV(query: any) {
    const where: Prisma.StockMovementWhereInput = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.type) {
      where.type = query.type as MovementType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    const headers = [
      'MovementID',
      'ProductSKU',
      'ProductName',
      'Type',
      'Quantity',
      'PreviousStock',
      'NewStock',
      'Reason',
      'PerformedBy',
      'CreatedAt',
    ];

    const rows = movements.map((m) => [
      m.id,
      m.product.sku,
      `"${m.product.name.replace(/"/g, '""')}"`,
      m.type,
      m.quantity.toString(),
      m.previousStock.toString(),
      m.newStock.toString(),
      `"${(m.reason || '').replace(/"/g, '""')}"`,
      `"${m.createdBy.name.replace(/"/g, '""')}"`,
      m.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
