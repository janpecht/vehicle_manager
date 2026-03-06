import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as checklistsController from './checklists.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', checklistsController.list);
router.get('/:id', checklistsController.getById);
router.get('/:id/photos', checklistsController.listPhotos);

export default router;
