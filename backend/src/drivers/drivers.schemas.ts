import { z } from 'zod';

export const createDriverSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
});

export const updateDriverSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
