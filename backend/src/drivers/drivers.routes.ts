import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { createDriverSchema, updateDriverSchema } from './drivers.schemas.js';
import * as driversController from './drivers.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', driversController.list);
router.get('/:id', driversController.getById);
router.post('/', validate(createDriverSchema), driversController.create);
router.put('/:id', validate(updateDriverSchema), driversController.update);
router.delete('/:id', driversController.remove);

export default router;
