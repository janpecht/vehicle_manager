import type { Request, Response, NextFunction } from 'express';
import * as vehiclesService from './vehicles.service.js';
import { vehicleQuerySchema } from './vehicles.schemas.js';
import type { CreateVehicleInput, UpdateVehicleInput } from './vehicles.schemas.js';

function getIdParam(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') throw new Error('Missing id parameter');
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = vehicleQuerySchema.parse(req.query);
    const result = await vehiclesService.listVehicles(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicle = await vehiclesService.getVehicle(getIdParam(req));
    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CreateVehicleInput;
    const vehicle = await vehiclesService.createVehicle(input);
    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as UpdateVehicleInput;
    const vehicle = await vehiclesService.updateVehicle(getIdParam(req), input);
    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await vehiclesService.deleteVehicle(getIdParam(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
