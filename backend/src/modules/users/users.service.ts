import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { UpdateUserInput, ChangeUserPasswordInput } from './users.schema';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';

export class UsersService {
  private userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  async getAllUsers(query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const total = await prisma.user.count();
    const data = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: this.userSelect,
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  async updateUser(id: string, input: UpdateUserInput) {
    // Check if user exists
    await this.getUserById(id);

    const user = await prisma.user.update({
      where: { id },
      data: input,
      select: this.userSelect,
    });
    return user;
  }

  async deactivateUser(id: string) {
    // Check if user exists
    await this.getUserById(id);

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: this.userSelect,
    });
    return user;
  }

  async changePassword(id: string, input: ChangeUserPasswordInput, currentUserId: string, currentUserRole: string) {
    // Access control check: must be admin OR self
    if (currentUserRole !== 'ADMIN' && currentUserId !== id) {
      throw new ApiError(403, 'You can only change your own password');
    }

    // Verify user exists
    await this.getUserById(id);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }
}

export const usersService = new UsersService();
export default usersService;
