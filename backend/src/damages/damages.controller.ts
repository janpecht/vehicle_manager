import type { Request, Response, NextFunction } from 'express';
import * as damagesService from './damages.service.js';
import { damageQuerySchema } from './damages.schemas.js';
import type { CreateDamageInput } from './damages.schemas.js';

function getIdParam(req: Request, paramName: string): string {
  const id = req.params[paramName];
  if (typeof id !== 'string') throw new Error(`Missing ${paramName} parameter`);
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicleId = getIdParam(req, 'vehicleId');
    const query = damageQuerySchema.parse(req.query);
    const damages = await damagesService.listDamages(vehicleId, query);
    res.json({ damages });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehicleId = getIdParam(req, 'vehicleId');
    const userId = req.user!.userId;
    const input = req.body as CreateDamageInput;
    const damage = await damagesService.createDamage(vehicleId, userId, input);
    res.status(201).json({ damage });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const damageId = getIdParam(req, 'damageId');
    const damage = await damagesService.getDamage(damageId);
    res.json({ damage });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const damageId = getIdParam(req, 'damageId');
    await damagesService.deleteDamage(damageId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function repair(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const damageId = getIdParam(req, 'damageId');
    const userId = req.user!.userId;
    const damage = await damagesService.repairDamage(damageId, userId);
    res.json({ damage });
  } catch (error) {
    next(error);
  }
}
