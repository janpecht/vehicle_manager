import { Router } from 'express';
import * as vehiclesController from './vehicles.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createVehicleSchema, updateVehicleSchema } from './vehicles.schemas.js';

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

router.get('/', vehiclesController.list);
router.get('/:id', vehiclesController.getById);
router.post('/', authorize('ADMIN'), validate(createVehicleSchema), vehiclesController.create);
router.put('/:id', authorize('ADMIN'), validate(updateVehicleSchema), vehiclesController.update);
router.delete('/:id', authorize('ADMIN'), vehiclesController.remove);

export default router;
