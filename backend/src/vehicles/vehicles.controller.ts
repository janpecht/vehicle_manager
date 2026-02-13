import * as vehiclesService from './vehicles.service.js';
import { vehicleQuerySchema } from './vehicles.schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIdParam } from '../utils/params.js';
import type { CreateVehicleInput, UpdateVehicleInput } from './vehicles.schemas.js';

export const list = asyncHandler(async (req, res) => {
  const query = vehicleQuerySchema.parse(req.query);
  const result = await vehiclesService.listVehicles(query);
  res.json(result);
});

export const getById = asyncHandler(async (req, res) => {
  const vehicle = await vehiclesService.getVehicle(getIdParam(req));
  res.json({ vehicle });
});

export const create = asyncHandler(async (req, res) => {
  const input = req.body as CreateVehicleInput;
  const vehicle = await vehiclesService.createVehicle(input);
  res.status(201).json({ vehicle });
});

export const update = asyncHandler(async (req, res) => {
  const input = req.body as UpdateVehicleInput;
  const vehicle = await vehiclesService.updateVehicle(getIdParam(req), input);
  res.json({ vehicle });
});

export const remove = asyncHandler(async (req, res) => {
  await vehiclesService.deleteVehicle(getIdParam(req));
  res.status(204).send();
});
