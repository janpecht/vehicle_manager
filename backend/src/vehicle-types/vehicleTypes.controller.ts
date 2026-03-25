import type { Request, Response, NextFunction } from 'express';
import * as vehicleTypesService from './vehicleTypes.service.js';
import { imageSideSchema } from './vehicleTypes.schemas.js';
import { getIdParam } from '../utils/params.js';
import { sanitizeSvg } from '../utils/sanitizeSvg.js';


export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleTypes = await vehicleTypesService.listVehicleTypes();
    res.json({ vehicleTypes });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);
    const vehicleType = await vehicleTypesService.getVehicleType(id);
    res.json({ vehicleType });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicleType = await vehicleTypesService.createVehicleType(req.body);
    res.status(201).json({ vehicleType });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);
    const vehicleType = await vehicleTypesService.updateVehicleType(id, req.body);
    res.json({ vehicleType });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);
    await vehicleTypesService.deleteVehicleType(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);
    const sideParam = req.params.side;
    const side = typeof sideParam === 'string' ? sideParam : '';
    const sideResult = imageSideSchema.safeParse(side);
    if (!sideResult.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid side. Must be front, rear, left, or right' },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No image file provided' },
      });
      return;
    }

    let fileBuffer = req.file.buffer;
    if (req.file.mimetype === 'image/svg+xml') {
      fileBuffer = sanitizeSvg(fileBuffer);
    }

    const vehicleType = await vehicleTypesService.setImage(
      id,
      sideResult.data,
      fileBuffer,
      req.file.mimetype,
    );
    res.json({ vehicleType });
  } catch (err) {
    next(err);
  }
}

export async function serveImage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getIdParam(req);
    const sideParam = req.params.side;
    const side = typeof sideParam === 'string' ? sideParam : '';
    const sideResult = imageSideSchema.safeParse(side);
    if (!sideResult.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid side' },
      });
      return;
    }

    const image = await vehicleTypesService.getImage(id, sideResult.data);
    if (!image) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Image not found' },
      });
      return;
    }

    res.set('Content-Type', image.mimeType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (image.mimeType === 'image/svg+xml') {
      res.set('Content-Disposition', 'inline; filename="image.svg"');
      res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    }
    res.send(image.data);
  } catch (err) {
    next(err);
  }
}
