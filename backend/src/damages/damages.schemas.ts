import { z } from 'zod';
import { stripHtml } from '../utils/sanitize.js';

const viewSideEnum = z.enum(['FRONT', 'REAR', 'LEFT', 'RIGHT']);
const shapeEnum = z.enum(['CIRCLE', 'RECTANGLE']);
const severityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const createDamageSchema = z.object({
  viewSide: viewSideEnum,
  shape: shapeEnum,
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.01).max(1),
  height: z.number().min(0.01).max(1),
  description: z.string().max(500).transform(stripHtml).optional(),
  severity: severityEnum,
});

export const damageQuerySchema = z.object({
  viewSide: viewSideEnum.optional(),
  activeOnly: z
    .string()
    .transform((val) => val !== 'false')
    .default('true'),
});

export const updateDamagePositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export type CreateDamageInput = z.infer<typeof createDamageSchema>;
export type UpdateDamagePositionInput = z.infer<typeof updateDamagePositionSchema>;
export type DamageQuery = z.infer<typeof damageQuerySchema>;
