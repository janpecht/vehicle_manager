import * as damagesService from './damages.service.js';
import { damageQuerySchema } from './damages.schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIdParam } from '../utils/params.js';
import type { CreateDamageInput, UpdateDamagePositionInput } from './damages.schemas.js';

export const list = asyncHandler(async (req, res) => {
  const vehicleId = getIdParam(req, 'vehicleId');
  const query = damageQuerySchema.parse(req.query);
  const damages = await damagesService.listDamages(vehicleId, query);
  res.json({ damages });
});

export const create = asyncHandler(async (req, res) => {
  const vehicleId = getIdParam(req, 'vehicleId');
  const userId = req.user!.userId;
  const input = req.body as CreateDamageInput;
  const damage = await damagesService.createDamage(vehicleId, userId, input);
  res.status(201).json({ damage });
});

export const getById = asyncHandler(async (req, res) => {
  const damageId = getIdParam(req, 'damageId');
  const damage = await damagesService.getDamage(damageId);
  res.json({ damage });
});

export const updatePosition = asyncHandler(async (req, res) => {
  const damageId = getIdParam(req, 'damageId');
  const input = req.body as UpdateDamagePositionInput;
  const damage = await damagesService.updateDamagePosition(damageId, input);
  res.json({ damage });
});

export const remove = asyncHandler(async (req, res) => {
  const damageId = getIdParam(req, 'damageId');
  await damagesService.deleteDamage(damageId);
  res.status(204).send();
});

export const repair = asyncHandler(async (req, res) => {
  const damageId = getIdParam(req, 'damageId');
  const userId = req.user!.userId;
  const damage = await damagesService.repairDamage(damageId, userId);
  res.json({ damage });
});
