import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createVehicleTypeSchema, updateVehicleTypeSchema } from './vehicleTypes.schemas.js';
import * as vehicleTypesController from './vehicleTypes.controller.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.use(authenticate);

router.get('/', vehicleTypesController.list);
router.get('/:id', vehicleTypesController.getById);
router.post('/', authorize('ADMIN'), validate(createVehicleTypeSchema), vehicleTypesController.create);
router.put('/:id', authorize('ADMIN'), validate(updateVehicleTypeSchema), vehicleTypesController.update);
router.delete('/:id', authorize('ADMIN'), vehicleTypesController.remove);
router.post('/:id/images/:side', authorize('ADMIN'), upload.single('image'), vehicleTypesController.uploadImage);

export default router;
