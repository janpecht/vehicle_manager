import { z } from 'zod';

export const createChecklistSchema = z.object({
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  mileage: z.number().int().min(0),
  damageVisibility: z.enum(['NEW_DAMAGE', 'KNOWN_DAMAGE', 'NO_DAMAGE']),
  seatsCleanliness: z.enum(['CLEAN', 'SLIGHTLY_DIRTY', 'VERY_DIRTY']),
  smokedInVehicle: z.boolean(),
  foodLeftovers: z.boolean(),
  cargoAreaClean: z.boolean(),
  freezerTempOk: z.boolean(),
  chargingCablesOk: z.boolean(),
  deliveryNotesPresent: z.boolean().optional(),
  fuelLevel: z.enum(['OK', 'LOW']).optional(),
  notes: z.string().max(1000).optional(),
});

export const checklistQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type ChecklistQuery = z.infer<typeof checklistQuerySchema>;
