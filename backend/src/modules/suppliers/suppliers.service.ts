import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateSupplierInput, UpdateSupplierInput } from './suppliers.schema';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { Prisma } from '@prisma/client';

export class SuppliersService {
  async getAllSuppliers(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: Prisma.SupplierWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const total = await prisma.supplier.count({ where });
    const data = await prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    });

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });
    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }
    return supplier;
  }

  async createSupplier(input: CreateSupplierInput) {
    return prisma.supplier.create({
      data: {
        ...input,
        email: input.email || null,
      },
    });
  }

  async updateSupplier(id: string, input: UpdateSupplierInput) {
    await this.getSupplierById(id);
    return prisma.supplier.update({
      where: { id },
      data: {
        ...input,
        email: input.email === '' ? null : input.email,
      },
    });
  }

  async deleteSupplier(id: string) {
    await this.getSupplierById(id);
    // Soft delete
    return prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getSupplierProducts(id: string) {
    await this.getSupplierById(id);
    const relations = await prisma.productSupplier.findMany({
      where: { supplierId: id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });
    return relations.map((r) => r.product);
  }

  async getSupplierOrders(id: string) {
    await this.getSupplierById(id);
    return prisma.order.findMany({
      where: { supplierId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const suppliersService = new SuppliersService();
export default suppliersService;
