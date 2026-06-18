import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export class CategoriesService {
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  }

  async createCategory(input: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { name: input.name },
    });
    if (existing) {
      throw new ApiError(409, 'Category with this name already exists');
    }
    return prisma.category.create({
      data: { name: input.name },
    });
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    await this.getCategoryById(id);

    const existing = await prisma.category.findUnique({
      where: { name: input.name },
    });
    if (existing && existing.id !== id) {
      throw new ApiError(409, 'Category with this name already exists');
    }

    return prisma.category.update({
      where: { id },
      data: { name: input.name },
    });
  }

  async deleteCategory(id: string) {
    await this.getCategoryById(id);

    // Check if any products are linked to this category
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ApiError(400, 'Cannot delete category with associated products');
    }

    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;
