import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { createVehicleTypeSchema, updateVehicleTypeSchema } from './vehicleTypes.schemas.js';
import * as vehicleTypesController from './vehicleTypes.controller.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.use(authenticate);

router.get('/', vehicleTypesController.list);
router.get('/:id', vehicleTypesController.getById);
router.post('/', validate(createVehicleTypeSchema), vehicleTypesController.create);
router.put('/:id', validate(updateVehicleTypeSchema), vehicleTypesController.update);
router.delete('/:id', vehicleTypesController.remove);
router.post('/:id/images/:side', upload.single('image'), vehicleTypesController.uploadImage);

export default router;
