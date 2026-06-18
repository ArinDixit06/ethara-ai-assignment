import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const changeUserPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;
