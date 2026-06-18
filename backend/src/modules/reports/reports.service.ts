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
    const products = await prisma.product.findMany({
      where: {
        currentStock: {
          lte: prisma.product.fields.reorderThreshold,
        },
        isActive: true,
      },
      include: { category: true },
      orderBy: { currentStock: 'asc' },
    });

    return products;
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
    // 1. Total products
    const totalProducts = await prisma.product.count({ where: { isActive: true } });

    // 2. Total inventory value
    const valuationRes = await this.getInventoryValuation();
    const totalInventoryValue = valuationRes.totalValuation;

    // 3. Low stock count
    const lowStockCount = await prisma.product.count({
      where: {
        currentStock: {
          lte: prisma.product.fields.reorderThreshold,
        },
        isActive: true,
      },
    });

    // 4. Pending orders count (CONFIRMED or SHIPPED status)
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED],
        },
      },
    });

    // 5. Stock movements last 7 days (including today)
    const stockMovementsLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const movements = await prisma.stockMovement.findMany({
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
        select: {
          type: true,
          quantity: true,
        },
      });

      let inbound = 0;
      let outbound = 0;
      movements.forEach((m) => {
        if (m.type === MovementType.INBOUND) inbound += m.quantity;
        else if (m.type === MovementType.OUTBOUND) outbound += m.quantity;
      });

      const dateString = date.toISOString().split('T')[0];
      stockMovementsLast7Days.push({
        date: dateString,
        inbound,
        outbound,
      });
    }

    // 6. Inventory value by category
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          select: {
            currentStock: true,
            costPrice: true,
          },
        },
      },
    });

    const inventoryValueByCategory = categories
      .map((c) => {
        const value = c.products.reduce((sum, p) => sum + p.currentStock * Number(p.costPrice), 0);
        return {
          category: c.name,
          value,
        };
      })
      .filter((c) => c.value > 0);

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
