import { z } from 'zod';

export const createVehicleTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

export const updateVehicleTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
});

const VIEW_SIDES = ['front', 'rear', 'left', 'right'] as const;
export type ImageSide = (typeof VIEW_SIDES)[number];

export const imageSideSchema = z.enum(VIEW_SIDES);

export type CreateVehicleTypeInput = z.infer<typeof createVehicleTypeSchema>;
export type UpdateVehicleTypeInput = z.infer<typeof updateVehicleTypeSchema>;
