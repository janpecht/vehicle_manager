import { Router } from 'express';
import * as vehiclesService from '../vehicles/vehicles.service.js';
import * as damagesService from '../damages/damages.service.js';
import * as driversService from '../drivers/drivers.service.js';
import * as checklistsService from '../checklists/checklists.service.js';
import { createChecklistSchema } from '../checklists/checklists.schemas.js';
import { damageQuerySchema } from '../damages/damages.schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIdParam } from '../utils/params.js';
import { sendChecklistNotification, hasAlarmCondition } from '../utils/email.js';
import type { ChecklistEmailData } from '../utils/email.js';
import { upload } from '../utils/upload.js';
import { config } from '../config.js';

const router = Router();

/** GET /public/config — public app config (allowed email domain etc.) */
router.get('/config', (_req, res) => {
  res.json({ allowedEmailDomain: config.ALLOWED_EMAIL_DOMAIN });
});

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

/** GET /public/vehicles — list active vehicles (for checklist form dropdown) */
router.get('/vehicles', asyncHandler(async (_req, res) => {
  const result = await vehiclesService.listVehicles({ search: undefined, includeInactive: false, page: 1, limit: 1000 });
  res.json(result.vehicles);
}));

/** GET /public/drivers — list active drivers (for checklist form dropdown) */
router.get('/drivers', asyncHandler(async (_req, res) => {
  const drivers = await driversService.listDrivers(false);
  res.json(drivers);
}));

/** POST /public/checklist — submit a checklist form (public) */
router.post('/checklist', asyncHandler(async (req, res) => {
  const input = createChecklistSchema.parse(req.body);
  const submission = await checklistsService.createChecklist(input);

  // Send email notification only when alarm conditions are met
  const emailData: ChecklistEmailData = {
    driverName: submission.driver.name,
    vehiclePlate: submission.vehicle.licensePlate,
    date: new Date(submission.submittedAt).toLocaleString('de-DE'),
    mileage: submission.mileage,
    damageVisibility: submission.damageVisibility,
    dashboardWarnings: submission.dashboardWarnings,
    seatsDirty: submission.seatsDirty,
    smokedInVehicle: submission.smokedInVehicle,
    foodLeftovers: submission.foodLeftovers,
    cargoAreaDirty: submission.cargoAreaDirty,
    freezerTempOk: submission.freezerTempOk,
    chargingCablesOk: submission.chargingCablesOk,
    deliveryNotesPresent: submission.deliveryNotesPresent,
    fuelLevel: submission.fuelLevel,
    carWashNeeded: submission.carWashNeeded,
    notes: submission.notes,
  };

  if (hasAlarmCondition(emailData)) {
    sendChecklistNotification(emailData).catch((err) => {
      console.error('Failed to send checklist notification email:', err);
    });
  }

  res.status(201).json(submission);
}));

/** POST /public/checklist/:id/photos — upload damage photos for a submission */
router.post('/checklist/:id/photos', upload.array('photos', 10), asyncHandler(async (req, res) => {
  const submissionId = getIdParam(req);
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No photos provided' } });
    return;
  }

  const results = [];
  for (const file of files) {
    const photo = await checklistsService.addPhoto(
      submissionId,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    results.push(photo);
  }

  res.status(201).json({ photos: results });
}));

/** GET /public/checklist-photos/:id — serve a checklist photo */
router.get('/checklist-photos/:id', asyncHandler(async (req, res) => {
  const photoId = getIdParam(req);
  const photo = await checklistsService.getPhoto(photoId);

  if (!photo) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Photo not found' } });
    return;
  }

  res.set('Content-Type', photo.mimeType);
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(photo.data);
}));

export default router;
