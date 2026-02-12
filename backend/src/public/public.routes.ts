import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as vehiclesService from '../vehicles/vehicles.service.js';
import * as damagesService from '../damages/damages.service.js';
import { damageQuerySchema } from '../damages/damages.schemas.js';

const router = Router();

function getIdParam(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') throw new Error('Missing id parameter');
  return id;
}

/** GET /public/vehicles/:id/report — public, no auth required */
router.get('/vehicles/:id/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicleId = getIdParam(req);
    const query = damageQuerySchema.parse({});
    const [vehicle, damages] = await Promise.all([
      vehiclesService.getVehicle(vehicleId),
      damagesService.listDamages(vehicleId, query),
    ]);
    res.json({ vehicle, damages });
  } catch (error) {
    next(error);
  }
});

export default router;
