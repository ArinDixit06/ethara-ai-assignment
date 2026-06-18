import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Invalid email address' });

export const passwordSchema = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters long' });

export const skuSchema = z
  .string()
  .min(3, { message: 'SKU must be at least 3 characters' })
  .regex(/^[A-Z0-9-]+$/, { message: 'SKU must be uppercase alphanumeric and can contain dashes' });
