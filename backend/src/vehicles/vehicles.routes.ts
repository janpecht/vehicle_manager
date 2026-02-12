import { Router } from 'express';
import * as vehiclesController from './vehicles.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { createVehicleSchema, updateVehicleSchema } from './vehicles.schemas.js';

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

router.get('/', vehiclesController.list);
router.get('/:id', vehiclesController.getById);
router.post('/', validate(createVehicleSchema), vehiclesController.create);
router.put('/:id', validate(updateVehicleSchema), vehiclesController.update);
router.delete('/:id', vehiclesController.remove);

export default router;
