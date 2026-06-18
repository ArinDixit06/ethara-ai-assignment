import { prisma } from '../../config/database';
import { OrderStatus, OrderType, MovementType } from '@prisma/client';

export class ReportsService {
  async getInventoryValuation() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    let totalValuation = 0;
    const valuationList = products.map((p) => {
      const cost = Number(p.costPrice) || 0;
      const valuation = p.currentStock * cost;
      totalValuation += valuation;

      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        currentStock: p.currentStock,
        costPrice: cost,
        valuation,
      };
    });

    return {
      totalValuation,
      products: valuationList,
    };
  }

  async getStockMovementSummary(query: any) {
    const where: any = {};

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
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let inboundCount = 0;
    let outboundCount = 0;
    let adjustmentCount = 0;
    let inboundQty = 0;
    let outboundQty = 0;
    let adjustmentQty = 0;

    movements.forEach((m) => {
      if (m.type === MovementType.INBOUND) {
        inboundCount++;
        inboundQty += m.quantity;
      } else if (m.type === MovementType.OUTBOUND) {
        outboundCount++;
        outboundQty += m.quantity;
      } else if (m.type === MovementType.ADJUSTMENT) {
        adjustmentCount++;
        adjustmentQty += m.quantity;
      }
    });

    return {
      summary: {
        totalMovements: movements.length,
        inbound: { count: inboundCount, quantity: inboundQty },
        outbound: { count: outboundCount, quantity: outboundQty },
        adjustment: { count: adjustmentCount, quantity: adjustmentQty },
      },
      movements,
    };
  }

  async getLowStock() {
    // Use raw SQL for column-to-column comparison (currentStock <= reorderThreshold)
    const products = await prisma.$queryRaw<any[]>`
      SELECT
        p.*,
        row_to_json(c.*) AS category
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE p."currentStock" <= p."reorderThreshold"
        AND p."isActive" = true
      ORDER BY p."currentStock" ASC
    `;

    return products.map((p: any) => ({
      ...p,
      category: typeof p.category === 'string' ? JSON.parse(p.category) : p.category,
    }));
  }

  async getOrderSummary() {
    // Orders grouped by status
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const ordersByStatus = statusCounts.map((group) => ({
      status: group.status,
      count: group._count.id,
    }));

    // Supplier spend (sum of totalAmount for confirmed, shipped, received, fulfilled purchase orders)
    const suppliers = await prisma.supplier.findMany({
      include: {
        orders: {
          where: {
            type: OrderType.PURCHASE,
            status: {
              in: [
                OrderStatus.CONFIRMED,
                OrderStatus.SHIPPED,
                OrderStatus.RECEIVED,
                OrderStatus.FULFILLED,
              ],
            },
          },
          select: {
            totalAmount: true,
          },
        },
      },
    });

    const supplierSpend = suppliers
      .map((s) => {
        const totalSpend = s.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        return {
          supplierId: s.id,
          supplierName: s.name,
          spend: totalSpend,
        };
      })
      .filter((s) => s.spend > 0)
      .sort((a, b) => b.spend - a.spend);

    return {
      ordersByStatus,
      supplierSpend,
    };
  }

  async getDashboardStats() {
    // Run all independent top-level queries in parallel for speed
    const [
      totalProducts,
      lowStockCountResult,
      pendingOrdersCount,
      stockMovementRows,
      categoryValueRows,
      allProducts,
    ] = await Promise.all([
      // 1. Total active products
      prisma.product.count({ where: { isActive: true } }),

      // 2. Low stock count — raw SQL for column-to-column comparison
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM "Product"
        WHERE "currentStock" <= "reorderThreshold"
          AND "isActive" = true
      `,

      // 3. Pending orders count (CONFIRMED or SHIPPED)
      prisma.order.count({
        where: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED] } },
      }),

      // 4. Stock movements last 7 days — single GROUP BY raw SQL (UTC-safe)
      prisma.$queryRaw<{ day: string; type: string; total: bigint }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
          "type",
          SUM("quantity") AS total
        FROM "StockMovement"
        WHERE "createdAt" >= (NOW() AT TIME ZONE 'UTC' - INTERVAL '6 days')::date
        GROUP BY day, "type"
        ORDER BY day ASC
      `,

      // 5. Inventory value by category — raw SQL SUM to avoid Prisma Decimal coercion issues
      prisma.$queryRaw<{ category: string; value: number }[]>`
        SELECT
          c."name" AS category,
          COALESCE(SUM(p."currentStock" * p."costPrice"), 0)::float AS value
        FROM "Category" c
        LEFT JOIN "Product" p
          ON p."categoryId" = c.id AND p."isActive" = true
        GROUP BY c."name"
        HAVING COALESCE(SUM(p."currentStock" * p."costPrice"), 0) > 0
        ORDER BY value DESC
      `,

      // 6. All active products for total inventory value
      prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, costPrice: true },
      }),
    ]);

    // --- Compute total inventory value from fetched products ---
    const totalInventoryValue = allProducts.reduce((acc, p) => {
      return acc + p.currentStock * Number(p.costPrice);
    }, 0);

    const lowStockCount = Number(lowStockCountResult[0].count);

    // --- Build 7-day stock movements grid (fill missing days with 0) ---
    // Create a map from raw SQL results: { 'YYYY-MM-DD': { inbound, outbound } }
    const movementMap: Record<string, { inbound: number; outbound: number }> = {};
    for (const row of stockMovementRows) {
      if (!movementMap[row.day]) {
        movementMap[row.day] = { inbound: 0, outbound: 0 };
      }
      if (row.type === 'INBOUND') {
        movementMap[row.day].inbound += Number(row.total);
      } else if (row.type === 'OUTBOUND') {
        movementMap[row.day].outbound += Number(row.total);
      }
    }

    // Build full 7-day array including days with no movements
    const stockMovementsLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const dateString = d.toISOString().split('T')[0];
      stockMovementsLast7Days.push({
        date: dateString,
        inbound: movementMap[dateString]?.inbound ?? 0,
        outbound: movementMap[dateString]?.outbound ?? 0,
      });
    }

    // --- Category inventory: cast value to number ---
    const inventoryValueByCategory = categoryValueRows.map((row) => ({
      category: row.category,
      value: Number(row.value),
    }));

    return {
      totalProducts,
      totalInventoryValue,
      lowStockCount,
      pendingOrdersCount,
      stockMovementsLast7Days,
      inventoryValueByCategory,
    };
  }
}

export const reportsService = new ReportsService();
export default reportsService;

