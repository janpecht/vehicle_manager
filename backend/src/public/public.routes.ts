import { Router } from 'express';
import * as vehiclesService from '../vehicles/vehicles.service.js';
import * as damagesService from '../damages/damages.service.js';
import { damageQuerySchema } from '../damages/damages.schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIdParam } from '../utils/params.js';

const router = Router();

/** GET /public/vehicles/:id/report — public, no auth required */
router.get('/vehicles/:id/report', asyncHandler(async (req, res) => {
  const vehicleId = getIdParam(req);
  const query = damageQuerySchema.parse({});
  const [vehicle, damages] = await Promise.all([
    vehiclesService.getVehicle(vehicleId),
    damagesService.listDamages(vehicleId, query),
  ]);
  res.json({ vehicle, damages });
}));

export default router;
