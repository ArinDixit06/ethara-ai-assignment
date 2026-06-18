import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateOrderInput, UpdateOrderInput } from './orders.schema';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { OrderStatus, OrderType, MovementType, Prisma } from '@prisma/client';

export class OrdersService {
  private async generateOrderNumber(type: OrderType): Promise<string> {
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);

    // Count existing orders of this type created in the current year
    const count = await prisma.order.count({
      where: {
        type,
        createdAt: {
          gte: startOfYear,
        },
      },
    });

    const prefix = type === OrderType.PURCHASE ? 'PO' : 'SO';
    const seq = String(count + 1).padStart(4, '0');
    let orderNumber = `${prefix}-${year}-${seq}`;

    // Just in case of collision, verify it is unique
    let exists = await prisma.order.findUnique({ where: { orderNumber } });
    let attempts = 1;
    while (exists) {
      const nextSeq = String(count + 1 + attempts).padStart(4, '0');
      orderNumber = `${prefix}-${year}-${nextSeq}`;
      exists = await prisma.order.findUnique({ where: { orderNumber } });
      attempts++;
    }

    return orderNumber;
  }

  async getAllOrders(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Prisma.OrderWhereInput = {};

    if (query.type) {
      where.type = query.type as OrderType;
    }
    if (query.status) {
      where.status = query.status as OrderStatus;
    }
    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    const total = await prisma.order.count({ where });
    const data = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        supplier: true,
      },
    });

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            product: true,
          },
        },
        statusHistory: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        supplier: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    return order;
  }

  async createOrder(input: CreateOrderInput, userId: string) {
    const { lineItems, supplierId, ...orderData } = input;

    // Verify supplier if purchase order
    if (input.type === OrderType.PURCHASE) {
      if (!supplierId) {
        throw new ApiError(400, 'Supplier is required for PURCHASE orders');
      }
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) {
        throw new ApiError(404, 'Supplier not found');
      }
    }

    const orderNumber = await this.generateOrderNumber(input.type);

    // Calculate subtotal for each item and aggregate totalAmount
    let totalAmount = 0;
    const lineItemsData = lineItems.map((item) => {
      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
      };
    });

    return prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          ...orderData,
          orderNumber,
          supplierId,
          totalAmount,
          createdById: userId,
          status: OrderStatus.DRAFT,
          lineItems: {
            create: lineItemsData,
          },
          statusHistory: {
            create: {
              status: OrderStatus.DRAFT,
              notes: 'Order draft created',
            },
          },
        },
        include: {
          lineItems: {
            include: { product: true },
          },
          statusHistory: true,
        },
      });

      return createdOrder;
    });
  }

  async updateOrder(id: string, input: UpdateOrderInput) {
    const order = await this.getOrderById(id);

    if (order.status !== OrderStatus.DRAFT) {
      throw new ApiError(400, 'Only DRAFT orders can be updated');
    }

    const { lineItems, supplierId, ...orderData } = input;

    // Verify supplier if provided
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) {
        throw new ApiError(404, 'Supplier not found');
      }
    }

    return prisma.$transaction(async (tx) => {
      // If line items are provided, replace them
      let totalAmount = order.totalAmount;
      if (lineItems !== undefined) {
        // Delete old items
        await tx.orderLineItem.deleteMany({
          where: { orderId: id },
        });

        // Compute new sub-amounts and create new items
        let newTotal = 0;
        const newItems = lineItems.map((item) => {
          const subtotal = item.quantity * item.unitPrice;
          newTotal += subtotal;
          return {
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          };
        });

        if (newItems.length > 0) {
          await tx.orderLineItem.createMany({
            data: newItems,
          });
        }
        totalAmount = new Prisma.Decimal(newTotal);
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...orderData,
          supplierId,
          totalAmount,
        },
        include: {
          lineItems: {
            include: { product: true },
          },
          statusHistory: true,
        },
      });

      return updatedOrder;
    });
  }

  async deleteOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.status !== OrderStatus.DRAFT) {
      throw new ApiError(400, 'Only DRAFT orders can be deleted');
    }

    // Cascade delete is handled by database cascade on lineItems and statusHistory
    return prisma.order.delete({
      where: { id },
    });
  }

  // Transitions
  async confirmOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.status !== OrderStatus.DRAFT) {
      throw new ApiError(400, `Cannot confirm order in status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CONFIRMED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CONFIRMED,
          notes: 'Order confirmed',
        },
      });

      return updated;
    });
  }

  async shipOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.type !== OrderType.PURCHASE) {
      throw new ApiError(400, 'Only PURCHASE orders can be marked as shipped');
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new ApiError(400, `Cannot ship order in status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.SHIPPED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.SHIPPED,
          notes: 'Purchase order shipped by supplier',
        },
      });

      return updated;
    });
  }

  async receiveOrder(id: string, userId: string) {
    const order = await this.getOrderById(id);

    if (order.type !== OrderType.PURCHASE) {
      throw new ApiError(400, 'Only PURCHASE orders can be marked as received');
    }

    if (order.status === OrderStatus.RECEIVED) {
      throw new ApiError(400, 'Order is already received');
    }

    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.CONFIRMED) {
      throw new ApiError(400, `Cannot receive order in status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // Loop over line items and update stock level, logging stock movements
      for (const item of order.lineItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new ApiError(404, `Product not found: ${item.productId}`);
        }

        const previousStock = product.currentStock;
        const newStock = previousStock + item.quantity;

        // Update current stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        // Log StockMovement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.INBOUND,
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Received PO Order: ${order.orderNumber}`,
            referenceId: order.id,
            createdById: userId,
          },
        });
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.RECEIVED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.RECEIVED,
          notes: 'Purchase order items received, stock updated',
        },
      });

      return updated;
    });
  }

  async packOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.type !== OrderType.SALES) {
      throw new ApiError(400, 'Only SALES orders can be marked as packed');
    }

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.DRAFT) {
      throw new ApiError(400, `Cannot pack order in status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // Status remains CONFIRMED or shifts to CONFIRMED
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CONFIRMED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CONFIRMED,
          notes: 'Sales order items packed and prepared for shipment',
        },
      });

      return updated;
    });
  }

  async dispatchOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.type !== OrderType.SALES) {
      throw new ApiError(400, 'Only SALES orders can be marked as dispatched');
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new ApiError(400, `Cannot dispatch order in status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.SHIPPED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.SHIPPED,
          notes: 'Sales order dispatched and shipped to customer',
        },
      });

      return updated;
    });
  }

  async fulfillOrder(id: string, userId: string) {
    const order = await this.getOrderById(id);

    if (order.type !== OrderType.SALES) {
      throw new ApiError(400, 'Only SALES orders can be marked as fulfilled');
    }

    if (order.status === OrderStatus.FULFILLED) {
      throw new ApiError(400, 'Order is already fulfilled');
    }

    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.CONFIRMED) {
      throw new ApiError(400, `Cannot fulfill order in status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // First pass: validate sufficient stock levels for all products
      for (const item of order.lineItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new ApiError(404, `Product not found: ${item.productId}`);
        }

        if (product.currentStock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for product: ${product.name}`);
        }
      }

      // Second pass: perform adjustments and log movements
      for (const item of order.lineItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const previousStock = product!.currentStock;
        const newStock = previousStock - item.quantity;

        // Update current stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        // Log StockMovement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.OUTBOUND,
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Fulfilled SO Order: ${order.orderNumber}`,
            referenceId: order.id,
            createdById: userId,
          },
        });
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.FULFILLED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.FULFILLED,
          notes: 'Sales order fulfilled, stock deducted',
        },
      });

      return updated;
    });
  }

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.status === OrderStatus.FULFILLED || order.status === OrderStatus.RECEIVED || order.status === OrderStatus.CANCELLED) {
      throw new ApiError(400, `Cannot cancel order in status: ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          notes: 'Order cancelled',
        },
      });

      return updated;
    });
  }
}

export const ordersService = new OrdersService();
export default ordersService;
