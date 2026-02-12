import { Router } from 'express';
import * as damagesController from './damages.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { createDamageSchema } from './damages.schemas.js';

const router = Router({ mergeParams: true });

// All damage routes require authentication
router.use(authenticate);

router.get('/', damagesController.list);
router.post('/', validate(createDamageSchema), damagesController.create);
router.get('/:damageId', damagesController.getById);
router.delete('/:damageId', damagesController.remove);
router.patch('/:damageId/repair', damagesController.repair);

export default router;
