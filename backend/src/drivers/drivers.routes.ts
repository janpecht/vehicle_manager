import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createDriverSchema, updateDriverSchema } from './drivers.schemas.js';
import * as driversController from './drivers.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', driversController.list);
router.get('/:id', driversController.getById);
router.post('/', authorize('ADMIN'), validate(createDriverSchema), driversController.create);
router.put('/:id', authorize('ADMIN'), validate(updateDriverSchema), driversController.update);
router.delete('/:id', authorize('ADMIN'), driversController.remove);

export default router;
