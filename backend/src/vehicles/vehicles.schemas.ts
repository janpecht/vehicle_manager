import { z } from 'zod';
import { stripHtml } from '../utils/sanitize.js';

/**
 * German license plate format:
 * 1-3 letters (city) + space/hyphen + 1-2 letters + space/hyphen + 1-4 digits
 * Examples: "HD-AB 1234", "B AB 123", "M-X 1", "KA-AB 1234"
 * Also allows special plates like "HD AB 1234" (space instead of hyphen).
 * Normalized: uppercase, single space between segments.
 */
const LICENSE_PLATE_REGEX = /^[A-ZÄÖÜ]{1,3}[\s-][A-Z]{1,2}[\s-]\d{1,4}[EH]?$/;

function normalizeLicensePlate(plate: string): string {
  return plate
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[-–—]/g, '-');
}

const licensePlateField = z
  .string()
  .min(1, 'License plate is required')
  .max(15, 'License plate is too long')
  .transform(normalizeLicensePlate)
  .refine((val) => LICENSE_PLATE_REGEX.test(val), {
    message: 'Invalid German license plate format (e.g. "HD-AB 1234")',
  });

export const createVehicleSchema = z.object({
  licensePlate: licensePlateField,
  label: z.string().max(100, 'Label is too long').transform(stripHtml).optional(),
  vehicleTypeId: z.string().uuid('Invalid vehicle type ID').optional().nullable(),
});

export const updateVehicleSchema = z.object({
  licensePlate: licensePlateField.optional(),
  label: z.string().max(100, 'Label is too long').transform(stripHtml).nullable().optional(),
  vehicleTypeId: z.string().uuid('Invalid vehicle type ID').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const vehicleQuerySchema = z.object({
  search: z.string().optional(),
  includeInactive: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;
